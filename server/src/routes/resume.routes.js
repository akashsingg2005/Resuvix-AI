import express from "express";

import {
  createResume,
  getMyResumes,
  getResume,
  updateResume,
  deleteResume,
  duplicateResume,
} from "../controllers/resume.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
  createResumeSchema,
  updateResumeSchema,
} from "../validators/resume.validation.js";

const router = express.Router();

// All resume routes require authentication
router.use(protect);

// Create Resume
router.post(
  "/",
  validate(createResumeSchema),
  createResume
);

// Get All My Resumes
router.get("/", getMyResumes);

// Get Single Resume
router.get("/:id", getResume);

// Update Resume
router.patch(
  "/:id",
  validate(updateResumeSchema),
  updateResume
);

// Delete Resume
router.delete("/:id", deleteResume);

// Duplicate Resume
router.post("/:id/duplicate", duplicateResume);

export default router;