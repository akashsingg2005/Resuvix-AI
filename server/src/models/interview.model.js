import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobRole: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    experienceLevel: {
      type: String,
      default: "1-3 Years",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert"],
      default: "Medium",
    },

    questionCount: {
      type: Number,
      default: 10,
    },

    interviewType: {
      type: String,
      enum: [
        "HR",
        "Behavioral",
        "Situational",
        "Role-Specific",
        "Technical",
        "Communication",
        "Full Mock",
      ],
      default: "Full Mock",
    },

    resumeData: {
      skills: [String],
      experience: String,
      projects: String,
      education: String,
      rawText: String,
    },

    jdData: {
      targetRole: String,
      requiredSkills: [String],
      missingSkills: [String],
      responsibilities: String,
      rawText: String,
    },

    questions: [
      {
        questionId: String,
        category: String,
        question: String,
        keyConcepts: [String],
        modelAnswer: String,
        tips: String,

        userAnswer: {
          type: String,
          default: "",
        },
        answerType: {
          type: String,
          enum: ["text", "voice", "code"],
          default: "text",
        },
        followUpQuestion: {
          type: String,
          default: "",
        },
        followUpAnswer: {
          type: String,
          default: "",
        },

        evaluation: {
          score: Number,
          verdict: String,
          strengths: [String],
          areasToImprove: [String],
          missingKeywords: [String],
          idealAnswer: String,
          starAnalysis: {
            situation: String,
            task: String,
            action: String,
            result: String,
            recommendation: String,
          },
        },
      },
    ],

    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    overallScore: {
      type: Number,
      default: 0,
    },

    performanceVerdict: {
      type: String,
      default: "Pending",
    },

    categoryScores: [
      {
        category: String,
        score: Number,
      },
    ],

    overallStrengths: [String],

    overallWeaknesses: [String],

    communicationAnalysis: {
      clarity: Number,
      structure: Number,
      conciseness: Number,
      professionalTone: Number,
      fillerWords: [String],
      feedback: String,
    },

    personalizedImprovementPlan: [
      {
        step: Number,
        area: String,
        action: String,
        recommendation: String,
      },
    ],

    isCompleted: {
      type: Boolean,
      default: false,
    },

    isVoice: {
      type: Boolean,
      default: false,
    },

    isCoding: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
