import express from "express";

import {
  register,
  login,
  logout,
  refresh,
  me,
  updatePassword,
  forgotPasswordController,
  verifyOTPController,
  resetPasswordController,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../validators/auth.validation.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post("/refresh-token", refresh);

router.post("/logout", protect, logout);

router.get("/me", protect, me);
router.post(
    "/forgot-password",
    forgotPasswordController
);

router.post(
    "/verify-otp",
    verifyOTPController
);

router.post(
    "/reset-password",
    resetPasswordController
);

router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  updatePassword
);

export default router;