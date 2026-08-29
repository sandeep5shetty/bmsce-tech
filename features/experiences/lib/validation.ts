import { z } from "zod";

/**
 * Every stage of a placement process, not just interviews — ordered the way a
 * drive usually runs so the dropdown reads chronologically. The original seven
 * values are kept verbatim (rows already in the DB use them); "Aptitude",
 * "Coding" and "Assignment" are the additions that let a writeup cover the
 * pre-interview stages.
 */
export const roundTypeOptions = [
  "Aptitude",
  "OA",
  "Coding",
  "Technical",
  "System Design",
  "GD",
  "Managerial",
  "HR",
  "Assignment",
  "Other",
] as const;

export type RoundType = (typeof roundTypeOptions)[number];

/** Long-form labels for the abbreviations, used in dropdowns and detail views. */
export const roundTypeLabel: Record<RoundType, string> = {
  Aptitude: "Aptitude Test",
  OA: "Online Assessment (OA)",
  Coding: "Coding Round",
  Technical: "Technical Interview",
  "System Design": "System Design",
  GD: "Group Discussion",
  Managerial: "Managerial Round",
  HR: "HR Interview",
  Assignment: "Take-home Assignment",
  Other: "Other",
};

export const resultOptions = [
  "Selected",
  "Rejected",
  "Waitlisted",
  "In Process",
] as const;

export const difficultyOptions = ["Easy", "Medium", "Hard"] as const;

/**
 * Per-round verdict. This is the flag that makes a writeup skimmable — a reader
 * can see how far the candidate got without reading a single description.
 */
export const roundOutcomeOptions = [
  "Cleared",
  "Not Cleared",
  "Awaiting Result",
] as const;

export type RoundOutcome = (typeof roundOutcomeOptions)[number];

export const experienceRoundSchema = z.object({
  roundNumber: z.number().min(1),
  roundType: z.enum(roundTypeOptions),
  description: z
    .string()
    .min(10, "Add a bit more detail about this round")
    .max(2000),
  difficulty: z.enum(difficultyOptions).optional(),
  outcome: z.enum(roundOutcomeOptions).optional(),
});

export type ExperienceRoundInput = z.infer<typeof experienceRoundSchema>;

/** Document formats accepted for the JD and for extra resources. */
export const documentTypeOptions = ["pdf", "docx"] as const;

export type DocumentType = (typeof documentTypeOptions)[number];

/** An uploaded document already sitting in S3, as returned by the upload route. */
export const uploadedDocumentSchema = z.object({
  url: z.string().min(1),
  type: z.enum(documentTypeOptions),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(0),
});

export type UploadedDocumentInput = z.infer<typeof uploadedDocumentSchema>;

/**
 * An extra resource: one uploaded document plus its own name, so the list is
 * readable without opening every file.
 */
export const resourceSchema = uploadedDocumentSchema.extend({
  title: z.string().min(2, "Give this resource a name").max(100),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

export const postCommentSchema = z.object({
  experienceId: z.string().min(1),
  body: z.string().min(3, "Question is too short").max(1000),
});

export type PostCommentInput = z.infer<typeof postCommentSchema>;

export const createExperienceSchema = z.object({
  driveId: z.string().optional(),
  companyName: z.string().min(2, "Company name is required").max(100),
  companyLogoUrl: z.string().max(500).optional(),
  role: z.string().min(2, "Role is required").max(100),
  batch: z.string().min(1, "Batch is required").max(20),
  result: z.enum(resultOptions),
  ctcLpa: z.number().min(0).max(200).optional(),
  overview: z
    .string()
    .min(20, "Share a bit more about your overall experience")
    .max(4000),
  preparationResources: z.string().max(2000).optional(),
  jd: uploadedDocumentSchema.optional(),
  rounds: z.array(experienceRoundSchema).min(1, "Add at least one round"),
  resources: z.array(resourceSchema).max(20).default([]),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
