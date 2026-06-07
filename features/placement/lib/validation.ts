import { z } from "zod";

export const createDriveSchema = z.object({
  title: z.string().min(2, "Company name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  deadline: z.string().min(1, "Deadline is required"),
  minPgCgpa: z.number().min(0, "Cannot be negative").max(10, "Cannot exceed 10"),
  allowBacklog: z.boolean().default(false),
  maxBacklogs: z.number().min(0).max(100).default(0),
  minTenthPercent: z.number().min(0).max(100).default(0),
  minTwelthPercent: z.number().min(0).max(100).default(0),
  minDegreeCgpa: z.number().min(0).max(10).default(0),
  genderAllowed: z.enum(["All", "Male", "Female", "Other"]).default("All"),
  categoryAllowed: z.enum(["All", "General", "OBC", "SC", "ST"]).default("All"),
});

export type CreateDriveInput = z.infer<typeof createDriveSchema>;

export const submitResponseSchema = z.object({
  driveId: z.string().min(1),
  userId: z.string().min(1),
  hasRegistered: z.boolean(),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

export const upsertProfileSchema = z.object({
  userId: z.string().min(1, "Student is required"),
  pgCgpa: z.number().min(0, "Cannot be negative").max(10, "Cannot exceed 10"),
  hasBacklog: z.boolean().default(false),
  backlogCount: z.number().min(0).max(100).default(0),
  isPlacementEligible: z.boolean().default(true),
  batch: z.string().min(1, "Batch is required").max(20),
  tenthPercent: z.number().min(0).max(100).default(0),
  twelthPercent: z.number().min(0).max(100).default(0),
  degreeType: z.string().max(50).optional(),
  degreeCgpa: z.number().min(0).max(10).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  category: z.enum(["General", "OBC", "SC", "ST"]).optional(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;

export const bulkProfileRowSchema = z.object({
  usn: z.string().min(1),
  pgCgpa: z.number().min(0).max(10),
  backlogCount: z.number().min(0).max(100).default(0),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  category: z.enum(["General", "OBC", "SC", "ST"]).optional(),
  tenthPercent: z.number().min(0).max(100).default(0),
  twelthPercent: z.number().min(0).max(100).default(0),
  degreeType: z.string().max(50).optional(),
  degreeCgpa: z.number().min(0).max(10).optional(),
  batch: z.string().max(20).default("2024-26"),
});

export type BulkProfileRow = z.infer<typeof bulkProfileRowSchema>;
