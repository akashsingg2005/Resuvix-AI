import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";
import { parsePDFToText } from "../services/ai.service.js";
import {
  generateRoleAgnosticQuestionsAI,
  evaluateAnswerAndCheckFollowUpAI,
  generateFinalInterviewReportAI,
} from "../services/ai.service.js";

/**
 * Start a New Interview Session
 * Server-Enforced Entitlement Check: 1st interview is 100% FREE.
 */
export const startInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Security & Entitlement Verification
  // 1. Pro Yearly Pass: user.planType === 'pro' or active subscription
  // 2. Single Pass Credit: user.paidInterviewsCount > 0 (1 extra access per single pass)
  // 3. First Free Access: !user.hasUsedFreeInterview
  const isPro = user.planType === "pro" || (user.premium && user.planType !== "single" && (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date()));
  const hasPaidPass = (user.paidInterviewsCount || 0) > 0;
  const hasFreePass = !user.hasUsedFreeInterview;

  if (!isPro && !hasPaidPass && !hasFreePass) {
    return res.status(403).json({
      success: false,
      isLimitReached: true,
      message: "You have used your free AI Mock Interview. Upgrade to Pro for unlimited practice or buy a Single Pass for 1 extra session.",
    });
  }

  // Deduct/Mark Quota Usage
  if (!isPro) {
    if (hasPaidPass) {
      user.paidInterviewsCount = Math.max(0, user.paidInterviewsCount - 1);
      await user.save();
    } else if (hasFreePass) {
      user.hasUsedFreeInterview = true;
      await user.save();
    }
  }

  const {
    jobRole = "Software Engineer",
    companyName = "",
    experienceLevel = "1-3 Years",
    difficulty = "Medium",
    questionCount = 10,
    interviewType = "Full Mock",
    resumeText: bodyResumeText = "",
    jdText: bodyJdText = "",
    isVoice = false,
    isCoding = false,
  } = req.body;

  let resumeText = bodyResumeText;
  let jdText = bodyJdText;

  // Handle uploaded files if any
  if (req.files) {
    if (req.files.resumeFile && req.files.resumeFile[0]) {
      try {
        const text = await parsePDFToText(req.files.resumeFile[0].buffer);
        if (text && text.trim()) resumeText = text;
      } catch (e) {
        console.error("Resume PDF parse error:", e.message);
      }
    }
    if (req.files.jdFile && req.files.jdFile[0]) {
      try {
        const text = await parsePDFToText(req.files.jdFile[0].buffer);
        if (text && text.trim()) jdText = text;
      } catch (e) {
        console.error("JD PDF parse error:", e.message);
      }
    }
  }

  const rawQuestions = await generateRoleAgnosticQuestionsAI({
    jobRole,
    companyName,
    experienceLevel,
    difficulty,
    questionCount,
    interviewType,
    resumeData: { rawText: resumeText },
    jdData: { rawText: jdText },
  });

  const formattedQuestions = rawQuestions.map((q, idx) => ({
    questionId: `q_${idx + 1}`,
    category: q.category || interviewType,
    question: q.question,
    keyConcepts: q.keyConcepts || [],
    modelAnswer: q.modelAnswer || "",
    tips: q.tips || "",
    userAnswer: "",
    followUpQuestion: "",
    followUpAnswer: "",
  }));

  const interview = await Interview.create({
    userId,
    jobRole,
    companyName,
    experienceLevel,
    difficulty,
    questionCount: formattedQuestions.length,
    interviewType,
    resumeData: { rawText: resumeText },
    jdData: { rawText: jdText },
    questions: formattedQuestions,
    isVoice: Boolean(isVoice),
    isCoding: Boolean(isCoding),
  });

  res.status(201).json(
    new ApiResponse(201, "Interview session initialized successfully", interview)
  );
});

/**
 * Submit Live Answer for Question & Evaluate (with Dynamic Follow-Up)
 */
export const submitAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionIndex, answer, answerType = "text", followUpAnswer } = req.body;

  const interview = await Interview.findOne({ _id: id, userId: req.user._id });
  if (!interview) {
    throw new ApiError(404, "Interview session not found");
  }

  const idx = Number(questionIndex);
  if (isNaN(idx) || idx < 0 || idx >= interview.questions.length) {
    throw new ApiError(400, "Invalid question index");
  }

  const q = interview.questions[idx];
  q.userAnswer = answer || q.userAnswer || "";
  q.answerType = answerType;
  if (followUpAnswer) q.followUpAnswer = followUpAnswer;

  const evalResult = await evaluateAnswerAndCheckFollowUpAI({
    jobRole: interview.jobRole,
    interviewType: interview.interviewType,
    question: q.question,
    answer: q.userAnswer,
  });

  q.evaluation = {
    score: evalResult.score,
    verdict: evalResult.verdict,
    strengths: evalResult.strengths,
    areasToImprove: evalResult.areasToImprove,
    missingKeywords: evalResult.missingKeywords,
    idealAnswer: evalResult.idealAnswer || q.modelAnswer,
    starAnalysis: evalResult.starAnalysis,
  };

  if (evalResult.shouldFollowUp && evalResult.followUpQuestion && !q.followUpQuestion) {
    q.followUpQuestion = evalResult.followUpQuestion;
  }

  interview.currentQuestionIndex = Math.min(interview.questions.length - 1, idx + 1);
  await interview.save();

  res.status(200).json(
    new ApiResponse(200, "Answer evaluated successfully", {
      question: q,
      shouldFollowUp: Boolean(evalResult.shouldFollowUp && !followUpAnswer),
      followUpQuestion: evalResult.shouldFollowUp ? evalResult.followUpQuestion : "",
    })
  );
});

/**
 * Complete Interview & Generate Comprehensive Report
 */
export const completeInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const interview = await Interview.findOne({ _id: id, userId: req.user._id });
  if (!interview) {
    throw new ApiError(404, "Interview session not found");
  }

  const finalReport = await generateFinalInterviewReportAI(interview);

  interview.overallScore = finalReport.overallScore;
  interview.performanceVerdict = finalReport.performanceVerdict;
  interview.categoryScores = finalReport.categoryScores;
  interview.overallStrengths = finalReport.overallStrengths;
  interview.overallWeaknesses = finalReport.overallWeaknesses;
  interview.communicationAnalysis = finalReport.communicationAnalysis;
  interview.personalizedImprovementPlan = finalReport.personalizedImprovementPlan;
  interview.isCompleted = true;
  interview.completedAt = new Date();

  await interview.save();

  // Mark free interview quota as used if user is not premium
  const user = await User.findById(req.user._id);
  const isPremium = user.premium || user.planType === "pro" || user.planType === "single";
  if (!isPremium && !user.hasUsedFreeInterview) {
    user.hasUsedFreeInterview = true;
    await user.save();
  }

  res.status(200).json(
    new ApiResponse(200, "Interview completed successfully", interview)
  );
});

/**
 * Fetch User's Interview History
 */
export const getUserInterviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  const isPro = user.planType === "pro" || (user.premium && user.planType !== "single");
  const hasPaidPass = (user.paidInterviewsCount || 0) > 0;

  let interviews = [];
  if (isPro || hasPaidPass || user.premium) {
    interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
  } else {
    // Free users can see their single completed free interview
    interviews = await Interview.find({ userId, isCompleted: true }).sort({ createdAt: -1 }).limit(1);
  }

  res.status(200).json(
    new ApiResponse(200, "Interview history retrieved", {
      interviews,
      isPro,
      paidInterviewsCount: user.paidInterviewsCount || 0,
      hasUsedFreeInterview: Boolean(user.hasUsedFreeInterview),
    })
  );
});

/**
 * Fetch Single Detailed Interview Report
 */
export const getInterviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const interview = await Interview.findOne({ _id: id, userId: req.user._id });

  if (!interview) {
    throw new ApiError(404, "Interview report not found");
  }

  res.status(200).json(
    new ApiResponse(200, "Interview details retrieved", interview)
  );
});

/**
 * Fetch Progress Tracking Score Timeline
 */
export const getInterviewProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const interviews = await Interview.find({ userId, isCompleted: true })
    .sort({ completedAt: 1 })
    .select("jobRole overallScore performanceVerdict completedAt createdAt");

  let totalImprovement = 0;
  if (interviews.length >= 2) {
    totalImprovement = interviews[interviews.length - 1].overallScore - interviews[0].overallScore;
  }

  res.status(200).json(
    new ApiResponse(200, "Progress score data retrieved", {
      timeline: interviews,
      totalImprovement,
    })
  );
});
