import { z } from "zod";
export const externalFileSchema = z
  .object({
    connectionUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .optional(),
    folderUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .optional(),
    mimeType: z.string().trim().min(1),
    name: z.string().trim().min(1, "File name is required."),
    url: z.url("Enter a valid HTTP or HTTPS URL."),
  })
  .strict();
