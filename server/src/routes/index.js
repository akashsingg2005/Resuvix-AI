import express from "express";

import authRoutes from "./auth.routes.js";
import resumeRoutes from "./resume.routes.js";
import settingsRoutes from "./settings.routes.js";
import couponRoutes from "./coupon.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = express.Router();

// Authentication Routes
router.use("/auth", authRoutes);

// Resume Routes
router.use("/resumes", resumeRoutes);

router.use("/settings", settingsRoutes);

router.use("/coupons", couponRoutes);

router.use("/payment", paymentRoutes);

export default router;