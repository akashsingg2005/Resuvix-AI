import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    template: {
      type: String,
      default: "modern",
    },

    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
    },

    summary: {
      type: String,
      default: "",
    },

    skills: [
      {
        type: String,
      },
    ],

    education: [
      {
        degree: String,
        college: String,
        startYear: String,
        endYear: String,
        cgpa: String,
      },
    ],

    experience: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],

    projects: [
      {
        title: String,
        description: String,
        github: String,
        live: String,
      },
    ],

    certifications: [
      {
        title: String,
        issuer: String,
        year: String,
      },
    ],

    atsScore: {
      type: Number,
      default: 0,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;