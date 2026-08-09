import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  saveCoverLetter,
  getMyCoverLetters,
  deleteCoverLetter,
  sendCoverLetterEmail,
} from "../controllers/coverLetter.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", saveCoverLetter);
router.post("/send-email", sendCoverLetterEmail);
router.get("/", getMyCoverLetters);
router.delete("/:id", deleteCoverLetter);

export default router;
