import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
  registerUser,
  sendRegisterOTP,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from "../services/auth.service.js";

/**
 * Cookie Options
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

/**
 * Send Register OTP
 */
export const sendRegisterOTPController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json(new ApiResponse(400, "Email is required."));
  }
  const result = await sendRegisterOTP(email.trim());
  res.status(200).json(new ApiResponse(200, result.message, result));
});

/**
 * Register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  res
    .cookie("accessToken", result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json(
      new ApiResponse(201, "User registered successfully", {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
});

/**
 * Login
 */
export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  res
    .cookie("accessToken", result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json(
      new ApiResponse(200, "Login successful", {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
});

/**
 * Logout
 */
export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user.id);

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json(new ApiResponse(200, "Logout successful"));
});

/**
 * Refresh Token
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  const accessToken = await refreshAccessToken(token);

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .status(200)
    .json(
      new ApiResponse(200, "Access token refreshed", {
        accessToken,
      })
    );
});

/**
 * Get Current User
 */
export const me = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "User profile fetched successfully", {
      user: req.user,
    })
  );
});

/**
 * Change Password
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await changePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully"));
});

/**
 * Forgot Password
 */
export const forgotPasswordController = asyncHandler(async (req, res) => {

    const { email } = req.body;

    await forgotPassword(email);

    res.status(200).json(

        new ApiResponse(

            200,

            "OTP sent successfully to your email."

        )

    );

});

/**
 * Verify OTP
 */
export const verifyOTPController = asyncHandler(async (req, res) => {

    const { email, otp } = req.body;

    await verifyOTP(email, otp);

    res.status(200).json(

        new ApiResponse(

            200,

            "OTP verified successfully."

        )

    );

});

/**
 * Reset Password
 */
export const resetPasswordController = asyncHandler(async (req, res) => {

    const {
        email,
        otp,
        newPassword,
    } = req.body;

    await resetPassword(
        email,
        otp,
        newPassword
    );

    res.status(200).json(

        new ApiResponse(

            200,

            "Password reset successfully."

        )

    );

});