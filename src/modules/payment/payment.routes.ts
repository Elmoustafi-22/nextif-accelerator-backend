import { Router } from "express";
import { 
  getPaymentConfig, 
  initializePayment, 
  paystackWebhook 
} from "./payment.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

// Price configuration (Can be public or protected, but protected is better)
router.get("/config", protect, getPaymentConfig);

// Initialize payment (Requires authentication)
router.post("/initialize", protect, initializePayment);

// Webhook (MUST be public as Paystack calls it)
router.post("/webhook", paystackWebhook);

export default router;
