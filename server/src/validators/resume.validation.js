import { z } from "zod";

export const createResumeSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),

  template: z
    .string()
    .optional(),

  personalInfo: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  }),

  summary: z.string().optional(),

  skills: z.array(z.string()).optional(),

  education: z.array(
    z.object({
      degree: z.string(),
      college: z.string(),
      startYear: z.string(),
      endYear: z.string(),
      cgpa: z.string().optional(),
    })
  ).optional(),

  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      description: z.string(),
    })
  ).optional(),

  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      github: z.string().optional(),
      live: z.string().optional(),
    })
  ).optional(),

  certifications: z.array(
    z.object({
      title: z.string(),
      issuer: z.string(),
      year: z.string(),
    })
  ).optional(),
});

export const updateResumeSchema = createResumeSchema.partial();