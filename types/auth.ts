import { z } from "zod";

import {
  signInSchema,
  signUpSchema,
  signUpWithConfirmSchema,
} from "@/validation/auth";

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type SignUpWithConfirmSchema = z.infer<typeof signUpWithConfirmSchema>;
