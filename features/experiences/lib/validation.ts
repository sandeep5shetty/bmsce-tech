import { z } from "zod";

export const roundTypeOptions = [
  "OA",
  "Technical",
  "HR",
  "Managerial",
  "GD",
  "System Design",
  "Other",
] as const;

export const resultOptions = ["Selected", "Rejected", "Waitlisted"] as const;

export const difficultyOptions = ["Easy", "Medium", "Hard"] as const;

export const experienceRoundSchema = z.object({
  roundNumber: z.number().min(1),
  roundType: z.enum(roundTypeOptions),
  description: z.string().min(10, "Add a bit more detail about this round").max(2000),
  difficulty: z.enum(difficultyOptions).optional(),
});

export type ExperienceRoundInput = z.infer<typeof experienceRoundSchema>;

export const resourceTypeOptions = ["pdf", "youtube", "text"] as const;

export const resourceSchema = z
  .object({
    type: z.enum(resourceTypeOptions),
    title: z.string().max(100).optional(),
    content: z.string().min(1).max(2000),
  })
  .superRefine((data, ctx) => {
    if (data.type === "text") {
      if (data.content.trim().length < 5) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Note is too short",
        });
      }
      return;
    }
    const isUrl = z.string().url().safeParse(data.content).success;
    if (!isUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: data.type === "pdf" ? "Enter a valid PDF link" : "Enter a valid YouTube link",
      });
    }
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
  role: z.string().min(2, "Role is required").max(100),
  batch: z.string().min(1, "Batch is required").max(20),
  result: z.enum(resultOptions),
  ctcLpa: z.number().min(0).max(200).optional(),
  overview: z.string().min(20, "Share a bit more about your overall experience").max(4000),
  preparationResources: z.string().max(2000).optional(),
  rounds: z.array(experienceRoundSchema).min(1, "Add at least one round"),
  resources: z.array(resourceSchema).max(20).default([]),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
