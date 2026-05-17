import { Request, Response } from "express";
import axios from "axios";
import requestIp from "request-ip";
import { getPriceByIP } from "../../utils/payment.util";
import Payment from "./payment.model";
import Ambassador from "../ambassador/ambassador.model";
import crypto from "crypto";

export const getPaymentConfig = async (req: Request, res: Response) => {
  const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
  const config = getPriceByIP(clientIp);
  res.json(config);
};

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user?.id;
    if (!ambassadorId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const ambassador = await Ambassador.findById(ambassadorId);
    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }

    const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
    const { currency, amount, displayPrice } = getPriceByIP(clientIp);

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: "Payment service not configured" });
    }

    const reference = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: ambassador.email,
        amount: amount,
        currency: currency,
        reference: reference,
        callback_url: `${process.env.FRONTEND_URL}/reports?payment=success`,
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

    if (response.data.status) {
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

      return res.json({
        checkout_url: response.data.data.authorization_url,
        reference: reference,
      });
    } else {
      return res.status(400).json({ message: "Failed to initialize payment" });
    }
  } catch (error: any) {
    console.error("Payment Initialization Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Internal server error during payment initialization" });
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
