import { Router } from "express";
import { 
  getPaymentConfig, 
  initializePayment, 
  paystackWebhook,
  verifyPayment,
  getPaymentRecords,
  getMyPaymentRecords
} from "./payment.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

// Price configuration (Can be public or protected, but protected is better)
router.get("/config", protect, getPaymentConfig);

// Initialize payment (Requires authentication)
router.post("/initialize", protect, initializePayment);

// Get my payments (Requires authentication)
router.get("/my", protect, getMyPaymentRecords);

// Verify payment after Paystack redirect (Requires authentication)
router.get("/verify/:reference", protect, verifyPayment);

// Payment records (Super Admin only, verified internally in controller)
router.get("/records", protect, getPaymentRecords);

// Webhook (MUST be public as Paystack calls it)
router.post("/webhook", paystackWebhook);

export default router;
