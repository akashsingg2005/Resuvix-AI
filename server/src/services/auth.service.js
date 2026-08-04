import ApiError from "../utils/ApiError.js";
import {
  createUser,
  findUserByEmail,
  updateRefreshToken,
  clearRefreshToken,
  findUserByIdWithPassword,
  updateLastLogin,
  findUserByEmailWithOTP,
  updateUserPassword,
} from "../repositories/auth.repository.js";

import { hashPassword, comparePassword } from "../utils/password.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import generateOTP from "../utils/generateOTP.js";
import { sendMail } from "./email.service.js";
import resetOTPTemplate from "../templates/resetOTP.template.js";

import {
  saveResetOTP,
} from "../repositories/auth.repository.js";

/**
 * Register User
 */
export const registerUser = async ({ fullName, email, password }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    fullName,
    email,
    password: hashedPassword,
  });

  const payload = {
    id: user._id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await updateRefreshToken(user._id, refreshToken);

  return {
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    premium: user.premium,
  },
  accessToken,
  refreshToken,
};
};

/**
 * Login User
 */
export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await comparePassword(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active");
  }

  const payload = {
    id: user._id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await updateRefreshToken(user._id, refreshToken);

  await updateLastLogin(user._id);

  return {
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    premium: user.premium,
  },
  accessToken,
  refreshToken,
};
};

/**
 * Logout User
 */
export const logoutUser = async (userId) => {
  await clearRefreshToken(userId);
};

/**
 * Refresh Access Token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await findUserByIdWithPassword(decoded.id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  const payload = {
    id: user._id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);

  return accessToken;
};

/**
 * Change Password
 */
export const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await findUserByIdWithPassword(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await comparePassword(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = await hashPassword(newPassword);

  await user.save();
};

/**
 * Forgot Password
 */
export const forgotPassword = async (email) => {

    const user = await findUserByEmail(email);

    if (!user) {
        throw new ApiError(
            404,
            "No account found with this email."
        );
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // OTP expires in 10 minutes
    const expiry = new Date(
        Date.now() + 10 * 60 * 1000
    );

    // Save OTP in MongoDB
    await saveResetOTP(
        user._id,
        otp,
        expiry
    );

    // Send email
    await sendMail({

        to: user.email,

        subject: "Reset Your Resuvix AI Password",

        html: resetOTPTemplate(
            user.fullName,
            otp
        )

    });

    return true;

};

/**
 * Verify OTP
 */
export const verifyOTP = async (
    email,
    otp
) => {

    const user =
        await findUserByEmailWithOTP(email);

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    if (!user.resetOTP) {
        throw new ApiError(
            400,
            "OTP not generated"
        );
    }

    if (user.resetOTP !== otp) {
        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    if (user.resetOTPExpiry < new Date()) {
        throw new ApiError(
            400,
            "OTP has expired"
        );
    }

    return true;

};

/**
 * Reset Password
 */
export const resetPassword = async (
    email,
    otp,
    newPassword
) => {

    const user = await findUserByEmailWithOTP(email);

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    if (user.resetOTP !== otp) {
        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    if (user.resetOTPExpiry < new Date()) {
        throw new ApiError(
            400,
            "OTP has expired"
        );
    }

    const hashedPassword =
        await hashPassword(newPassword);

    await updateUserPassword(
        user._id,
        hashedPassword
    );

    return true;

};