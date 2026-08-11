import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSettings);
router.patch("/", protect, adminOnly, updateSettings);
router.put("/", protect, adminOnly, updateSettings);

export default router;