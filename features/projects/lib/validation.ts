import { z } from "zod";

const urlSchema = z.string().url("Please enter a valid URL");

const techStackSchema = z.object({
  label: z.string().min(1, "Tech name is required"),
  image: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export const newProjectWithoutTechStackSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  body: z
    .string()
    .max(10000, "Content must be less than 10000 characters")
    .optional()
    .or(z.literal("")),
  liveLink: urlSchema,
  codeLink: z.url("Please enter a valid URL").optional().or(z.literal("")),
});

export const newProjectSchema = newProjectWithoutTechStackSchema.extend({
  techStack: z
    .array(techStackSchema)
    .max(10, "Maximum 10 technologies allowed")
    .optional()
    .default([]),
});

export type NewProjectSchema = z.infer<typeof newProjectWithoutTechStackSchema>;

export const reviewSchema = z.object({
  projectId: z.string(),
  design: z.number().min(0).max(10),
  userExperience: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  functionality: z.number().min(0).max(10),
  hireability: z.number().min(0).max(10),
  remark: z.string().optional(),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;
