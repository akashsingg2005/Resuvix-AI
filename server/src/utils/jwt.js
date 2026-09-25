import jwt from "jsonwebtoken";
import env from "../config/env.js";

const getAccessSecret = () => env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "resuvix_jwt_access_secret_key_2026_default";
const getRefreshSecret = () => env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "resuvix_jwt_refresh_secret_key_2026_default";
const getAccessExpires = () => env.JWT_ACCESS_EXPIRES || "1d";
const getRefreshExpires = () => env.JWT_REFRESH_EXPIRES || "7d";

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: getAccessExpires(),
  });
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: getRefreshExpires(),
  });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};