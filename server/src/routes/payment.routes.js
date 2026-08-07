import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getKey,
  getPricing,
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/key", getKey);
router.get("/pricing", getPricing);

// Protected payment routes
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/verify-payment", protect, verifyPayment);

export default router;