import { z } from "zod";

import { BUILT_IN_THEMES } from "./themes";

export const VALID_QUESTION_TYPES = [
  "single_select",
  "multi_select",
  "open_text",
  "rating_scale",
  "image_choice",
] as const;

export const CHOICE_QUESTION_TYPES = [
  "single_select",
  "multi_select",
  "image_choice",
] as const;

export const CORRECT_REQUIRED_TYPES = ["single_select", "multi_select"] as const;

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const gradientRegex = /^(linear|radial|conic)-gradient\s*\(/;

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(100),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer.")
    .nullable()
    .optional(),
});

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    theme_id: z
      .string()
      .nullable()
      .optional()
      .refine(
        (id) =>
          id == null ||
          id === "default" ||
          BUILT_IN_THEMES.some((t) => t.id === id),
        { message: "Invalid theme_id." },
      ),
    custom_theme: z
      .object({
        primaryColor: z
          .string()
          .regex(hexColorRegex, "Invalid hex color.")
          .optional()
          .nullable(),
        gradient: z
          .string()
          .max(500)
          .refine((v) => gradientRegex.test(v), {
            message:
              "custom_theme.gradient must begin with linear-gradient(, radial-gradient(, or conic-gradient(.",
          })
          .optional()
          .nullable(),
      })
      .nullable()
      .optional(),
    logo_url: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No valid fields provided for update.",
  });

export const publishEventSchema = z.object({
  action: z.enum(["publish", "unpublish"]),
});

export const answerOptionSchema = z.object({
  text: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_correct: z.boolean().optional(),
  position: z.number().int().positive().optional(),
});

export const createQuestionSchema = z
  .object({
    question_type: z.enum(VALID_QUESTION_TYPES),
    text: z.string().trim().min(1).max(255),
    time_limit: z.number().int().min(5).max(120).optional(),
    image_url: z.string().nullable().optional(),
    rating_min: z.number().int().min(1).max(10).nullable().optional(),
    rating_max: z.number().int().min(1).max(10).nullable().optional(),
    answer_options: z.array(answerOptionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.question_type === "rating_scale") {
      if (data.rating_min == null) {
        ctx.addIssue({
          code: "custom",
          message: "rating_min is required for rating_scale questions.",
          path: ["rating_min"],
        });
      }
      if (data.rating_max == null) {
        ctx.addIssue({
          code: "custom",
          message: "rating_max is required for rating_scale questions.",
          path: ["rating_max"],
        });
      }
      if (
        data.rating_min != null &&
        data.rating_max != null &&
        data.rating_min >= data.rating_max
      ) {
        ctx.addIssue({
          code: "custom",
          message: "rating_min must be less than rating_max.",
          path: ["rating_min"],
        });
      }
    }

    if (
      CHOICE_QUESTION_TYPES.includes(
        data.question_type as (typeof CHOICE_QUESTION_TYPES)[number],
      )
    ) {
      const options = data.answer_options ?? [];
      if (options.length < 2 || options.length > 4) {
        ctx.addIssue({
          code: "custom",
          message: "answer_options must have between 2 and 4 items.",
          path: ["answer_options"],
        });
      }
      if (
        CORRECT_REQUIRED_TYPES.includes(
          data.question_type as (typeof CORRECT_REQUIRED_TYPES)[number],
        ) &&
        !options.some((o) => o.is_correct === true)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "At least one answer option must be marked as correct.",
          path: ["answer_options"],
        });
      }
    }
  });

export const createSessionSchema = z.object({
  eventId: z.string().min(1),
});

export const advanceSessionSchema = z.object({
  action: z.enum(["start", "advance"]),
});

export const joinSessionSchema = z.object({
  joinCode: z.string().min(1).optional(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  participantToken: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()).optional(),
  openTextResponse: z.string().max(200).optional(),
  ratingValue: z.number().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type PublishEventInput = z.infer<typeof publishEventSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type AdvanceSessionInput = z.infer<typeof advanceSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

const displayNamePattern = new RegExp("^[\\p{L}\\p{N} \\-_]+$", "u");

export function validateDisplayName(name: string): boolean {
  if (name.length < 1 || name.length > 30) return false;
  return displayNamePattern.test(name);
}
