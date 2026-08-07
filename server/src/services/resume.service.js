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
 * Create New Resume with Permanent Free Quota Enforcement & Watermarking
 * Allows saving multiple different resumes per user account.
 */
export const createResumeService = async (userId, resumeData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let isWatermarked = false;

  if (!user.premium) {
    if (!user.hasUsedFreeQuota) {
      // First resume ever created for free user: unlocked PDF export
      isWatermarked = false;
      user.hasUsedFreeQuota = true;
      await user.save();
    } else {
      // Second or subsequent resume for non-premium user: saved with watermark
      isWatermarked = true;
    }
  }

  // Create a new distinct resume document in MongoDB
  return await createResume({
    ...resumeData,
    user: userId,
    isWatermarked,
  });
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