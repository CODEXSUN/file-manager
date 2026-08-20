import type { FastifyRequest } from "fastify";
import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";

export type ResolveFileManagerContext = (
  request: FastifyRequest,
) => FileManagerRequestContext | Promise<FileManagerRequestContext>;
