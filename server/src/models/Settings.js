import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "Resuvix AI",
    },

    supportEmail: {
      type: String,
      default: "support@resuvix.com",
    },

    premiumDownloadPrice: {
      type: Number,
      default: 49,
    },

    bulkDownloadPrice: {
      type: Number,
      default: 299,
    },

    bulkDownloadCount: {
      type: Number,
      default: 10,
    },

    watermarkEnabled: {
      type: Boolean,
      default: true,
    },

    razorpayKeyId: {
      type: String,
      default: "",
    },

    aiProvider: {
      type: String,
      default: "Gemini",
    },

    aiModel: {
      type: String,
      default: "gemini-2.5-flash",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Settings", settingsSchema);