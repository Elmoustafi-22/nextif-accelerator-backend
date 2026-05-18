import { Router } from "express";
import { 
  getPaymentConfig, 
  initializePayment, 
  paystackWebhook,
  getPaymentRecords
} from "./payment.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

// Price configuration (Can be public or protected, but protected is better)
router.get("/config", protect, getPaymentConfig);

// Initialize payment (Requires authentication)
router.post("/initialize", protect, initializePayment);

// Payment records (Super Admin only, verified internally in controller)
router.get("/records", protect, getPaymentRecords);

// Webhook (MUST be public as Paystack calls it)
router.post("/webhook", paystackWebhook);

export default router;
