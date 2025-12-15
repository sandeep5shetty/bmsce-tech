import z from "zod";

export const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be at most 50 characters long"),
  bio: z.string().max(500, "Bio must be at most 500 characters long"),
  image: z.url().optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  peerlist: z.string().url("Invalid Peerlist URL").optional().or(z.literal("")),
  portfolio: z
    .string()
    .url("Invalid Portfolio URL")
    .optional()
    .or(z.literal("")),
});
