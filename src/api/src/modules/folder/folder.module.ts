import type { FastifyInstance } from "fastify";
import type { ResolveFileManagerContext } from "../../host.js";
import { registerFolderRoutes } from "./folder.routes.js";

export const folderModule = {
  key: "file-manager.folder",
  register(app: FastifyInstance, resolveContext: ResolveFileManagerContext) {
    return registerFolderRoutes(app, resolveContext);
  },
} as const;
