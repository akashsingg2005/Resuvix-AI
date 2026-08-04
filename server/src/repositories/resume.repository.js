import Resume from "../models/resume.model.js";

/**
 * Create Resume
 */
export const createResume = async (resumeData) => {
  return await Resume.create(resumeData);
};

/**
 * Get All Resumes of a User
 */
export const getUserResumes = async (userId) => {
  return await Resume.find({ user: userId }).sort({
    updatedAt: -1,
  });
};

/**
 * Get Resume By ID
 */
export const getResumeById = async (resumeId) => {
  return await Resume.findById(resumeId);
};

/**
 * Update Resume
 */
export const updateResume = async (resumeId, updateData) => {
  return await Resume.findByIdAndUpdate(
    resumeId,
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );
};

/**
 * Delete Resume
 */
export const deleteResume = async (resumeId) => {
  return await Resume.findByIdAndDelete(resumeId);
};

/**
 * Duplicate Resume
 */
export const duplicateResume = async (resume) => {
  return await Resume.create(resume);
};