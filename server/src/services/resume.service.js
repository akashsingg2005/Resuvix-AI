import ApiError from "../utils/ApiError.js";

import {
  createResume,
  getUserResumes,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
} from "../repositories/resume.repository.js";

/**
 * Create Resume
 */
export const createResumeService = async (userId, resumeData) => {
  return await createResume({
    ...resumeData,
    user: userId,
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
 * Delete Resume
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

  const copiedResume = resume.toObject();

  delete copiedResume._id;
  delete copiedResume.createdAt;
  delete copiedResume.updatedAt;

  copiedResume.title = `${resume.title} (Copy)`;

  return await duplicateResume(copiedResume);
};