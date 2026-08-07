import mongoose from "mongoose";

const registerOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "10m" },
    },
  },
  {
    timestamps: true,
  }
);

const RegisterOTP = mongoose.model("RegisterOTP", registerOTPSchema);

export default RegisterOTP;
