import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import {
  generateResumeAI,
  scanATS,
  getInterviewQuestions,
  generateCoverLetter,
} from "../controllers/ai.controller.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Public route for ATS Scan (supports both guests and logged-in users)
router.post("/ats-scan", upload.single("file"), scanATS);

// Protected AI routes requiring authentication
router.post("/generate-resume", protect, generateResumeAI);
router.get("/interview-questions", protect, getInterviewQuestions);
router.post("/cover-letter", upload.single("file"), protect, generateCoverLetter);

export default router;
