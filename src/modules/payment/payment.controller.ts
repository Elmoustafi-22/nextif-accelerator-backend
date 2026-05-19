import { Request, Response } from "express";
import axios from "axios";
import requestIp from "request-ip";
import { getPriceByIP } from "../../utils/payment.util";
import Payment from "./payment.model";
import Ambassador from "../ambassador/ambassador.model";
import crypto from "crypto";
import { env } from "../../config/env";

export const getPaymentConfig = async (req: Request, res: Response) => {
  const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
  console.log(`[Payment] Config request from IP: ${clientIp}`);
  const config = getPriceByIP(clientIp);
  res.json(config);
};

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user?.id;
    console.log(`[Payment] Initializing payment for ambassador: ${ambassadorId}`);

    if (!ambassadorId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const ambassador = await Ambassador.findById(ambassadorId);
    if (!ambassador) {
      console.error(`[Payment] Ambassador not found: ${ambassadorId}`);
      return res.status(404).json({ message: "Ambassador not found" });
    }

    const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
    const { currency, amount, displayPrice } = getPriceByIP(clientIp);
    console.log(`[Payment] IP: ${clientIp}, Currency: ${currency}, Amount: ${amount}`);

    const paystackSecret = env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error("[Payment] PAYSTACK_SECRET_KEY is missing in env");
      return res.status(500).json({ message: "Payment service not configured on server" });
    }

    const reference = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Use callback URL from env if available, else fallback to frontend reports page
    const callback_url = env.PAYSTACK_CALLBACK_URL || `${env.FRONTEND_URL}/reports?payment=success`;

    console.log(`[Payment] Calling Paystack API with reference: ${reference}`);

    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: ambassador.email,
        amount: amount,
        currency: currency,
        reference: reference,
        callback_url: callback_url,
        metadata: {
          ambassadorId: ambassadorId,
          paymentType: "CERTIFICATE",
          displayPrice: displayPrice,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[Payment] Paystack response status:", paystackResponse.data.status);

    if (paystackResponse.data.status) {
      // Save pending payment to DB
      await Payment.create({
        ambassadorId,
        reference,
        amount,
        currency,
        status: "PENDING",
        paymentType: "CERTIFICATE",
        metadata: { displayPrice },
      });

      console.log(`[Payment] Pending payment created. Redirecting to: ${paystackResponse.data.data.authorization_url}`);

      return res.json({
        checkout_url: paystackResponse.data.data.authorization_url,
        reference: reference,
      });
    } else {
      console.error("[Payment] Paystack initialization failed:", paystackResponse.data.message);
      return res.status(400).json({ message: paystackResponse.data.message || "Failed to initialize payment" });
    }
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("[Payment] Initialization Error:", errorData);
    res.status(500).json({ 
      message: "Internal server error during payment initialization",
      details: env.NODE_ENV === 'development' ? errorData : undefined
    });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const ambassadorId = metadata.ambassadorId;

      const payment = await Payment.findOne({ reference });
      if (payment && payment.status !== "SUCCESS") {
        payment.status = "SUCCESS";
        await payment.save();

        // Update Ambassador to mark certificate as paid
        await Ambassador.findByIdAndUpdate(ambassadorId, {
          $set: { "profile.hasPaidCertificate": true, "profile.certificatePaymentDate": new Date() }
        });

        console.log(`Payment successful for Ambassador: ${ambassadorId}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    res.sendStatus(500);
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ message: "Reference is required" });
    }

    const paystackSecret = env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: "Payment service not configured" });
    }

    // Look up payment in our DB
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // If already marked SUCCESS, no need to re-verify
    if (payment.status === "SUCCESS") {
      return res.json({ status: "SUCCESS", message: "Payment already verified" });
    }

    // Call Paystack's verify endpoint
    console.log(`[Payment] Verifying reference with Paystack: ${reference}`);
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    const paystackData = paystackResponse.data?.data;
    console.log(`[Payment] Paystack verification status: ${paystackData?.status}`);

    if (paystackData?.status === "success") {
      // Update payment status
      payment.status = "SUCCESS";
      await payment.save();

      // Update Ambassador to mark certificate as paid
      await Ambassador.findByIdAndUpdate(payment.ambassadorId, {
        $set: { "profile.hasPaidCertificate": true, "profile.certificatePaymentDate": new Date() }
      });

      console.log(`[Payment] Verified and updated payment for Ambassador: ${payment.ambassadorId}`);
      return res.json({ status: "SUCCESS", message: "Payment verified successfully" });
    } else if (paystackData?.status === "failed") {
      payment.status = "FAILED";
      await payment.save();
      return res.json({ status: "FAILED", message: "Payment failed" });
    } else {
      // Still pending on Paystack's side (e.g. abandoned)
      return res.json({ status: "PENDING", message: "Payment is still pending" });
    }
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("[Payment] Verification Error:", errorData);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

export const getPaymentRecords = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const Admin = require("../admin/admin.model").default;
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(403).json({ message: "Forbidden: Admin profile not found" });
    }
    const titleLower = (admin.title || "").toLowerCase().trim();
    const isSuper = titleLower === "tech lead" || titleLower === "ceo" || titleLower === "chief executive officer";
    if (!isSuper) {
      return res.status(403).json({ message: "Forbidden: Super Admin privileges required" });
    }

    const payments = await Payment.find()
      .populate("ambassadorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment records", error });
  }
};
