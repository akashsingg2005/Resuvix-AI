import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js"; // Change the path if your filename is different

import {
  getKey,
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/key", getKey);

// Only logged-in users can pay
router.post("/create-order", protect, createOrder);

router.post("/verify", protect, verifyPayment);

export default router;