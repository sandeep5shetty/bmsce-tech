import { z } from "zod";

export function validateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): {
  success: boolean;
  data?: z.infer<T>;
  errors?: z.ZodError;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error,
  };
}

export function validateOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  return schema.parse(data);
}
