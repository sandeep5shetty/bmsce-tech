import z from "zod";

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    },
  );

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: password,
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long.")
    .max(50, "Name must not exceed 50 characters"),
  email: z.email("Please enter a valid email address"),
  password: password,
});

export const signUpWithConfirmSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long.")
      .max(50, "Name must not exceed 50 characters"),
    email: z.email("Please enter a valid email address"),
    password: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
