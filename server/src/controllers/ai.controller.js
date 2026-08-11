import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  generateAIResumeContent,
  analyzeATSContent,
  parsePDFToText,
  isResumeText,
  generateInterviewQuestionsAI,
  generateCoverLetterAI,
  generateInterviewPrepQuestionsAI,
  evaluateInterviewAnswerAI,
} from "../services/ai.service.js";

/**
 * Generate AI Resume Content
 */
export const generateResumeAI = asyncHandler(async (req, res) => {
  const content = await generateAIResumeContent(req.body);
  res.status(200).json(
    new ApiResponse(200, "AI Resume content generated successfully", content)
  );
});

/**
 * Run ATS Scan (Supports both JSON payload and PDF/DOCX file upload)
 */
export const scanATS = asyncHandler(async (req, res) => {
  let resumeText = req.body.resumeText || "";
  const jobDescription = req.body.jobDescription || "";
  const targetRole = req.body.targetRole || req.body.jobTitle || "";

  // If a file was uploaded, parse text from PDF buffer
  if (req.file) {
    try {
      const parsedText = await parsePDFToText(req.file.buffer);
      if (parsedText && parsedText.trim()) {
        resumeText = parsedText;
      }
    } catch (e) {
      console.error("PDF parsing exception:", e.message);
    }
  }

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please upload a valid PDF resume or paste your resume text.",
    });
  }

  // Non-Resume PDF Document Guard
  if (!isResumeText(resumeText)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Document: The uploaded file does not appear to be a valid Resume/CV. Please upload a proper Resume document containing your experience, education, or skills.",
    });
  }

  const analysis = await analyzeATSContent(resumeText, jobDescription, targetRole);

  res.status(200).json(
    new ApiResponse(200, "ATS analysis completed successfully", analysis)
  );
});

/**
 * Generate Mock Interview Questions
 */
export const getInterviewQuestions = asyncHandler(async (req, res) => {
  const { role, round } = req.body;
  const questions = await generateInterviewQuestionsAI(role, round);
  res.status(200).json(
    new ApiResponse(200, "Interview questions generated successfully", questions)
  );
});

/**
 * Generate Cover Letter
 */
export const generateCoverLetter = asyncHandler(async (req, res) => {
  let resumeText = req.body.resumeText || "";

  if (req.file) {
    try {
      const parsedText = await parsePDFToText(req.file.buffer);
      if (parsedText && parsedText.trim()) {
        resumeText = parsedText;
      }
    } catch (e) {
      console.error("Cover Letter PDF parsing exception:", e.message);
    }
  }

  const payload = {
    ...req.body,
    resumeText: resumeText || req.body.resumeText || req.body.experience || "",
  };

  const coverLetter = await generateCoverLetterAI(payload);
  res.status(200).json(
    new ApiResponse(200, "Cover letter generated successfully", { coverLetter })
  );
});

/**
 * Generate Advanced AI Interview Prep Questions
 */
export const generateInterviewPrep = asyncHandler(async (req, res) => {
  const { role, experienceLevel, roundType } = req.body;
  const questions = await generateInterviewPrepQuestionsAI({ role, experienceLevel, roundType });
  res.status(200).json(
    new ApiResponse(200, "Interview questions generated successfully", questions)
  );
});

/**
 * Evaluate Candidate Answer with Gemini AI
 */
export const evaluateInterviewAnswer = asyncHandler(async (req, res) => {
  const { role, question, answer, roundType } = req.body;
  const evaluation = await evaluateInterviewAnswerAI({ role, question, answer, roundType });
  res.status(200).json(
    new ApiResponse(200, "Answer evaluation completed successfully", evaluation)
  );
});
