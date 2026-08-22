import type { FastifyRequest } from "fastify";
import type { FileManagerRequestContext } from "./contracts.js";
import { z } from "zod";

const requestContextSchema = z.object({
  actorId: z.string().trim().min(1),
  host: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9-]{1,31}$/u, "Host key is invalid."),
  tenantId: z.string().trim().min(1).max(191),
});

export type ResolveFileManagerContext = (
  request: FastifyRequest,
) => FileManagerRequestContext | Promise<FileManagerRequestContext>;

export function validatedFileManagerContextResolver(
  resolveContext: ResolveFileManagerContext,
): ResolveFileManagerContext {
  return async (request) =>
    requestContextSchema.parse(await resolveContext(request));
}
