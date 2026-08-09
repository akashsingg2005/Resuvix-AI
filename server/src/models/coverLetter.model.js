import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    tone: {
      type: String,
      default: "Professional & Confident",
    },

    content: {
      type: String,
      required: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);

export default CoverLetter;
