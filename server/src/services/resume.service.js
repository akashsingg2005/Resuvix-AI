import ApiError from "../utils/ApiError.js";

import {
  createResume,
  getUserResumes,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
} from "../repositories/resume.repository.js";

import User from "../models/user.model.js";

/**
 * Create New Resume with Quota Enforcement & Watermarking
 * Rule 1: 1st Resume created is 100% FREE forever with unlimited edits & exports.
 * Rule 2: Pro yearly pass allows unlimited fresh new resumes.
 * Rule 3: Single Pass (paidResumesCount > 0) unlocks 1 fresh new resume with unlimited edits & exports.
 * Rule 4: Subsequent fresh resumes without pass are saved as watermarked.
 */
export const createResumeService = async (userId, resumeData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const existingResumes = await getUserResumes(userId);
  const existingCount = Array.isArray(existingResumes) ? existingResumes.length : 0;
  const isPro = user.planType === "pro" && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

  let isWatermarked = false;

  if (existingCount === 0) {
    // Rule 1: First resume ever created is 100% FREE with unlimited edits & exports!
    isWatermarked = false;
    user.hasUsedFreeQuota = true;
    await user.save();
  } else if (isPro) {
    // Rule 2: Pro Yearly Pass gives unlimited fresh new resumes!
    isWatermarked = false;
  } else if (user.paidResumesCount > 0) {
    // Rule 3: Single Pass unlocks 1 fresh new resume!
    isWatermarked = false;
    user.paidResumesCount = Math.max(0, user.paidResumesCount - 1);
    if (user.paidResumesCount === 0 && user.planType !== "pro") {
      user.planType = "free";
      user.premium = false;
    }
    await user.save();
  } else {
    // Rule 4: Fresh new resume without pass is watermarked
    isWatermarked = true;
  }

  const createdResume = await createResume({
    ...resumeData,
    user: userId,
    isWatermarked,
  });

  return {
    resume: createdResume,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      premium: user.premium,
      planType: user.planType,
      paidResumesCount: user.paidResumesCount,
      paidInterviewsCount: user.paidInterviewsCount,
      hasUsedFreeQuota: user.hasUsedFreeQuota,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    },
  };
};

/**
 * Export Resume & Check Watermark Status
 * Unwatermarked resumes (1st free resume or unlocked paid resume) allow UNLIMITED exports.
 */
export const exportResumeService = async (resumeId, userId) => {
  const resume = await getResumeById(resumeId);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPro = user.planType === "pro" && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

  // 1. Pro Unlimited Plan
  if (isPro) {
    resume.isWatermarked = false;
    await resume.save();
    return { resume, user, message: "Export allowed (Pro Unlimited)" };
  }

  // 2. Resume is already unwatermarked (e.g. 1st free resume or previously unlocked single pass resume)
  if (!resume.isWatermarked) {
    return { resume, user, message: "Export allowed (Unlimited edit & export for this resume)" };
  }

  // 3. User has a Single Pass credit to unlock this watermarked resume
  if (user.paidResumesCount > 0) {
    user.paidResumesCount = Math.max(0, user.paidResumesCount - 1);
    if (user.paidResumesCount === 0) {
      user.planType = "free";
      user.premium = false;
    }
    await user.save();

    resume.isWatermarked = false;
    await resume.save();
    return { resume, user, message: "Resume unlocked with 1 Single Pass credit!" };
  }

  // 4. Resume remains watermarked (Requires single pass or Pro upgrade)
  throw new ApiError(
    402,
    "Payment Required. This fresh new resume is watermarked. Buy a Single Pass or upgrade to Pro for unlimited resumes."
  );
};

/**
 * Get All User Resumes
 */
export const getMyResumesService = async (userId) => {
  return await getUserResumes(userId);
};

/**
 * Get Resume By ID
 */
export const getResumeByIdService = async (resumeId, userId) => {
  const resume = await getResumeById(resumeId);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return resume;
};

/**
 * Update Resume
 */
export const updateResumeService = async (
  resumeId,
  userId,
  updateData
) => {
  const resume = await getResumeById(resumeId);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return await updateResume(resumeId, updateData);
};

/**
 * Delete Resume (Preserves user.hasUsedFreeQuota permanently in DB)
 */
export const deleteResumeService = async (
  resumeId,
  userId
) => {
  const resume = await getResumeById(resumeId);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  await deleteResume(resumeId);
};

/**
 * Duplicate Resume
 */
export const duplicateResumeService = async (
  resumeId,
  userId
) => {
  const resume = await getResumeById(resumeId);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const user = await User.findById(userId);

  const copiedResume = resume.toObject();

  delete copiedResume._id;
  delete copiedResume.createdAt;
  delete copiedResume.updatedAt;

  copiedResume.title = `${resume.title} (Copy)`;
  copiedResume.isWatermarked = !user.premium;

  return await duplicateResume(copiedResume);
};