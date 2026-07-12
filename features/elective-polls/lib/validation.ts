import { z } from "zod";

import { isBmsceEmail } from "@/lib/bmsce-email";

const batchPattern = /^[\w-]{1,50}$/;
const sectionPattern = /^[\w-]{1,20}$/;

export const audienceRuleSchema = z.object({
  batch: z.string().trim().regex(batchPattern, "Invalid batch."),
  section: z
    .string()
    .trim()
    .regex(sectionPattern, "Invalid section.")
    .nullable()
    .optional(),
});

export const createOptionSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(150),
  description: z.string().max(500).nullable().optional(),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer.")
    .max(100_000),
});

export type CreateOptionInput = z.infer<typeof createOptionSchema>;

// Audience is one of three mutually exclusive modes:
//  - "all": every logged-in student (no rule, no member list)
//  - "group": a single roster batch/section, picked from a radio list
//  - "custom": an explicit, manually-picked list of individual students
const audienceFields = {
  audienceMode: z.enum(["all", "group", "custom"]).default("all"),
  audienceRule: audienceRuleSchema.nullable().optional(),
  audienceMemberStudentIds: z.array(z.string().min(1)).max(2000).default([]),
  // Only meaningful for "group" mode — students who'd otherwise match the
  // group's batch/section but should be carved out (e.g. already
  // shortlisted for another poll).
  audienceExcludedStudentIds: z.array(z.string().min(1)).max(2000).default([]),
};

const audienceRefinements: [
  (d: { audienceMode: string; audienceRule?: unknown }) => boolean,
  { message: string; path: string[] },
] = [
  (d) => d.audienceMode !== "group" || !!d.audienceRule,
  {
    message: "Select a group for a group-targeted poll.",
    path: ["audienceRule"],
  },
];

const audienceMemberRefinement: [
  (d: { audienceMode: string; audienceMemberStudentIds: string[] }) => boolean,
  { message: string; path: string[] },
] = [
  (d) => d.audienceMode !== "custom" || d.audienceMemberStudentIds.length > 0,
  {
    message: "Select at least one student for a custom audience.",
    path: ["audienceMemberStudentIds"],
  },
];

export const createPollSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(150),
    description: z.string().max(1000).nullable().optional(),
    closesAt: z.string().datetime().nullable().optional(),
    options: z
      .array(createOptionSchema)
      .min(1, "At least one option is required.")
      .max(30, "At most 30 options are allowed."),
    ...audienceFields,
  })
  .refine(...audienceRefinements)
  .refine(...audienceMemberRefinement);

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const updatePollDetailsSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().max(1000).nullable().optional(),
    closesAt: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields provided for update.",
  });

export type UpdatePollDetailsInput = z.infer<typeof updatePollDetailsSchema>;

export const updatePollStatusSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export const updateOptionSchema = z
  .object({
    label: z.string().trim().min(1).max(150).optional(),
    description: z.string().max(500).nullable().optional(),
    capacity: z.number().int().positive().max(100_000).optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields provided for update.",
  });

export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;

export const reorderOptionsSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1),
});

export type ReorderOptionsInput = z.infer<typeof reorderOptionsSchema>;

export const setAudienceSchema = z
  .object({ ...audienceFields })
  .refine(...audienceRefinements)
  .refine(...audienceMemberRefinement);

export type SetAudienceInput = z.infer<typeof setAudienceSchema>;

export const submitResponseSchema = z.object({
  optionId: z.string().min(1, "Please select an option."),
});

export const rosterSearchSchema = z.object({
  q: z.string().trim().max(100).default(""),
});

const usnPattern = /^[\w-]{1,20}$/;

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(150),
  usn: z.string().trim().toUpperCase().regex(usnPattern, "Invalid USN."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address.")
    .refine(isBmsceEmail, "Must be a valid BMSCE email address."),
  batch: z.string().trim().regex(batchPattern, "Invalid batch."),
  section: z.string().trim().regex(sectionPattern, "Invalid section."),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields provided for update.",
  });

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const reopenGrantSchema = z.object({
  studentIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one student.")
    .max(2000),
  remarks: z.string().trim().min(1, "Remarks are required.").max(2000),
});

export type ReopenGrantInput = z.infer<typeof reopenGrantSchema>;

export const inviteCollaboratorsSchema = z.object({
  emails: z
    .array(z.string().trim().email())
    .min(1, "Select at least one admin to invite.")
    .max(50),
});

export type InviteCollaboratorsInput = z.infer<
  typeof inviteCollaboratorsSchema
>;

export const respondToInviteSchema = z.object({
  response: z.enum(["accepted", "declined"]),
});

export type RespondToInviteInput = z.infer<typeof respondToInviteSchema>;
