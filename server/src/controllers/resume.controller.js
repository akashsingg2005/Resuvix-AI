import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
  createResumeService,
  getMyResumesService,
  getResumeByIdService,
  updateResumeService,
  deleteResumeService,
  duplicateResumeService,
} from "../services/resume.service.js";

/**
 * Create Resume
 */
export const createResume = asyncHandler(async (req, res) => {
  const resume = await createResumeService(req.user._id, req.body);

  res.status(201).json(
    new ApiResponse(201, "Resume created successfully", resume)
  );
});

/**
 * Get My Resumes
 */
export const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await getMyResumesService(req.user._id);

  res.status(200).json(
    new ApiResponse(200, "Resumes fetched successfully", resumes)
  );
});

/**
 * Get Resume By ID
 */
export const getResume = asyncHandler(async (req, res) => {
  const resume = await getResumeByIdService(
    req.params.id,
    req.user._id
  );

  res.status(200).json(
    new ApiResponse(200, "Resume fetched successfully", resume)
  );
});

/**
 * Update Resume
 */
export const updateResume = asyncHandler(async (req, res) => {
  const resume = await updateResumeService(
    req.params.id,
    req.user._id,
    req.body
  );

  res.status(200).json(
    new ApiResponse(200, "Resume updated successfully", resume)
  );
});

/**
 * Delete Resume
 */
export const deleteResume = asyncHandler(async (req, res) => {
  await deleteResumeService(req.params.id, req.user._id);

  res.status(200).json(
    new ApiResponse(200, "Resume deleted successfully")
  );
});

/**
 * Duplicate Resume
 */
export const duplicateResume = asyncHandler(async (req, res) => {
  const resume = await duplicateResumeService(
    req.params.id,
    req.user._id
  );

  res.status(201).json(
    new ApiResponse(201, "Resume duplicated successfully", resume)
  );
});