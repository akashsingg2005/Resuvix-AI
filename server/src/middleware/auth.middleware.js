import jwt from "jsonwebtoken";

import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { findUserById } from "../repositories/auth.repository.js";

/**
 * Protect Routes
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Cookie
  if (!token && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized. Please login.");
  }

  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  const user = await findUserById(decoded.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Your account is not active");
  }

  req.user = user;

  next();
});

/**
 * Admin Only
 */
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(
      403,
      "Access denied. Admins only."
    );
  }

  next();
};