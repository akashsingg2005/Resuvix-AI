import express from "express";

import authRoutes from "./auth.routes.js";
import resumeRoutes from "./resume.routes.js";
import settingsRoutes from "./settings.routes.js";
import couponRoutes from "./coupon.routes.js";
import paymentRoutes from "./payment.routes.js";
import aiRoutes from "./ai.routes.js";
import adminRoutes from "./admin.routes.js";
import coverLetterRoutes from "./coverLetter.routes.js";
import interviewRoutes from "./interview.routes.js";

const router = express.Router();

// Authentication Routes
router.use("/auth", authRoutes);

// Resume Routes
router.use("/resumes", resumeRoutes);

router.use("/settings", settingsRoutes);

router.use("/coupons", couponRoutes);

// Payment Routes (Support both /payment and /payments)
router.use("/payment", paymentRoutes);
router.use("/payments", paymentRoutes);

// AI Services Routes
router.use("/ai", aiRoutes);

// Cover Letter Routes
router.use("/cover-letters", coverLetterRoutes);

// Interview Preparation Routes
router.use("/interviews", interviewRoutes);

// Admin Routes
router.use("/admin", adminRoutes);

export default router;