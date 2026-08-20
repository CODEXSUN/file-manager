import { z } from "zod";
export const storageConnectionSchema = z
  .object({
    config: z.record(z.string(), z.unknown()),
    credentials: z.record(z.string(), z.unknown()).optional(),
    isDefault: z.boolean(),
    name: z.string().trim().min(1, "Connection name is required."),
    provider: z.enum([
      "local",
      "external_url",
      "s3",
      "cloudflare_r2",
      "google_drive",
    ]),
    status: z.enum(["active", "inactive"]),
  })
  .strict();
