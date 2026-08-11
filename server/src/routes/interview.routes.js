import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getUserInterviews,
  getInterviewById,
  getInterviewProgress,
} from "../controllers/interview.controller.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

// Protected Routes requiring authentication
router.post(
  "/start",
  protect,
  upload.fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "jdFile", maxCount: 1 },
  ]),
  startInterview
);

router.post("/:id/answer", protect, submitAnswer);
router.post("/:id/complete", protect, completeInterview);
router.get("/history", protect, getUserInterviews);
router.get("/progress", protect, getInterviewProgress);
router.get("/:id", protect, getInterviewById);

export default router;
