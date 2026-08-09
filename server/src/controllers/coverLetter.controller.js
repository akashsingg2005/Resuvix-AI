import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import CoverLetter from "../models/coverLetter.model.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * Create / Save Cover Letter
 */
export const saveCoverLetter = asyncHandler(async (req, res) => {
  const { title, jobTitle, companyName, tone, content, jobDescription, letterId } = req.body;

  if (!content || !jobTitle || !companyName) {
    throw new ApiError(400, "Job title, company name, and letter content are required.");
  }

  let letter;
  if (letterId) {
    letter = await CoverLetter.findOneAndUpdate(
      { _id: letterId, user: req.user._id },
      {
        title: title || `${jobTitle} - ${companyName}`,
        jobTitle,
        companyName,
        tone: tone || "Professional & Confident",
        content,
        jobDescription: jobDescription || "",
      },
      { new: true }
    );
  }

  if (!letter) {
    letter = await CoverLetter.create({
      user: req.user._id,
      title: title || `${jobTitle} - ${companyName}`,
      jobTitle,
      companyName,
      tone: tone || "Professional & Confident",
      content,
      jobDescription: jobDescription || "",
    });
  }

  res.status(200).json(
    new ApiResponse(200, "Cover Letter saved successfully", letter)
  );
});

/**
 * Get My Cover Letters
 */
export const getMyCoverLetters = asyncHandler(async (req, res) => {
  const letters = await CoverLetter.find({ user: req.user._id }).sort({ updatedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, "Cover letters fetched successfully", letters)
  );
});

/**
 * Delete Cover Letter
 */
export const deleteCoverLetter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const letter = await CoverLetter.findOneAndDelete({ _id: id, user: req.user._id });

  if (!letter) {
    throw new ApiError(404, "Cover letter not found or access denied");
  }

  res.status(200).json(
    new ApiResponse(200, "Cover letter deleted successfully", { id })
  );
});

/**
 * Send Cover Letter via Nodemailer
 */
export const sendCoverLetterEmail = asyncHandler(async (req, res) => {
  const { recipientEmail, jobTitle, companyName, content } = req.body;

  const targetEmail = recipientEmail || req.user.email;

  if (!targetEmail) {
    throw new ApiError(400, "Recipient email address is required.");
  }

  if (!content) {
    throw new ApiError(400, "Cover Letter content is required.");
  }

  const roleName = jobTitle || "Target Role";
  const company = companyName || "Target Company";
  const formattedContent = content.replace(/\n/g, "<br>");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #6C63FF, #06B6D4); padding: 28px 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 28px 24px; }
        .role-badge { display: inline-block; background: rgba(108, 99, 255, 0.1); color: #6C63FF; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12.5px; margin-bottom: 18px; }
        .paper-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 24px; font-size: 14px; line-height: 1.7; color: #1e293b; font-family: Georgia, serif; white-space: pre-wrap; word-break: break-word; }
        .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Resuvix AI Cover Letter</h1>
          <p>Your tailored ATS Cover Letter is ready</p>
        </div>
        <div class="body">
          <div class="role-badge">Role: ${roleName} • Company: ${company}</div>
          <div class="paper-card">${formattedContent}</div>
        </div>
        <div class="footer">
          Sent with ❤️ by Resuvix AI • <a href="http://localhost:5500" style="color: #6C63FF; text-decoration: none;">Launch Resuvix Workspace</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: targetEmail,
    subject: `Resuvix AI: Cover Letter for ${roleName} at ${company}`,
    html,
  });

  res.status(200).json(
    new ApiResponse(200, `Cover Letter sent to ${targetEmail} successfully!`, { recipientEmail: targetEmail })
  );
});
