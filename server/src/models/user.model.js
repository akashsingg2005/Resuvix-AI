import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    premium: {
      type: Boolean,
      default: false,
    },

    planType: {
      type: String,
      enum: ["free", "single", "pro"],
      default: "free",
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    paidResumesCount: {
      type: Number,
      default: 0,
    },

    paidInterviewsCount: {
      type: Number,
      default: 0,
    },

    hasUsedFreeQuota: {
      type: Boolean,
      default: false,
    },

    hasUsedFreeInterview: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    lastLogin: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    resetOTP: {
      type: String,
      default: null,
    },

    resetOTPExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;