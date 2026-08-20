import { resolve } from "node:path";
import { z } from "zod";

const schema = z.object({
  FILE_MANAGER_DB_HOST: z.string().min(1),
  FILE_MANAGER_DB_NAME: z.string().min(1),
  FILE_MANAGER_DB_PASSWORD: z.string().min(1),
  FILE_MANAGER_DB_PORT: z.coerce.number().int().positive(),
  FILE_MANAGER_DB_USER: z.string().min(1),
  FILE_MANAGER_ENCRYPTION_KEY: z.string().min(32),
  FILE_MANAGER_LOCAL_ROOT: z.string().min(1),
  FILE_MANAGER_MAX_UPLOAD_BYTES: z.coerce.number().int().positive(),
});

const parsed = schema.parse(process.env);

export const fileManagerEnv = {
  ...parsed,
  FILE_MANAGER_LOCAL_ROOT: resolve(parsed.FILE_MANAGER_LOCAL_ROOT),
};
