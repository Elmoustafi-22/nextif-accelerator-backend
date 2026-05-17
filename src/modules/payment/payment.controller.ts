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
