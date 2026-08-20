import type { FastifyInstance } from "fastify";
import type { ResolveFileManagerContext } from "../../host.js";
import { registerStorageConnectionRoutes } from "./storage-connection.routes.js";

export const storageConnectionModule = {
  key: "file-manager.storage-connection",
  register(app: FastifyInstance, resolveContext: ResolveFileManagerContext) {
    return registerStorageConnectionRoutes(app, resolveContext);
  },
} as const;
