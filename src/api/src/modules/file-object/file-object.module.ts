import type { FastifyInstance } from "fastify";
import type { ResolveFileManagerContext } from "../../host.js";
import { registerFileObjectRoutes } from "./file-object.routes.js";

export const fileObjectModule = {
  key: "file-manager.file-object",
  register(app: FastifyInstance, resolveContext: ResolveFileManagerContext) {
    return registerFileObjectRoutes(app, resolveContext);
  },
} as const;
