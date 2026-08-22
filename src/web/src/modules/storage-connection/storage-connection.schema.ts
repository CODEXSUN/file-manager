import { z } from "zod";
export const storageConnectionSchema = z
  .object({
    config: z.record(z.string(), z.unknown()),
    credentials: z.record(z.string(), z.unknown()).optional(),
    isDefault: z.boolean(),
    name: z.string().trim().min(1, "Connection name is required."),
    provider: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9_-]{1,31}$/u, "Storage provider is invalid."),
    status: z.enum(["active", "inactive"]),
  })
  .strict();
