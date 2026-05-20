import { Router } from "express";
import { 
  getPaymentConfig, 
  initializePayment, 
  paystackWebhook,
  verifyPayment,
  getPaymentRecords,
  getMyPaymentRecords,
  regenerateReceipt,
  recordManualPayment
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

// Record manual payment (Super Admin only)
router.post("/manual", protect, recordManualPayment);

// Regenerate receipt for an existing successful payment (Super Admin only)
router.post("/regenerate-receipt/:reference", protect, regenerateReceipt);

// Webhook (MUST be public as Paystack calls it)
router.post("/webhook", paystackWebhook);

export default router;
