import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";

const router = express.Router();

// Admin routes require authentication & admin role
router.use(protect);
router.use(adminOnly);

router.get("/stats", getAdminStats);

export default router;
