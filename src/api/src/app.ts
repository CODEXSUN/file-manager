import multipart from "@fastify/multipart";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";
import { bootstrapFileManagerDatabase } from "./database/file-manager-database.js";
import { runFileManagerMigrations } from "./database/migration.js";
import {
  fileObjectMigration,
  fileObjectModule,
} from "./modules/file-object/index.js";
import { folderMigration, folderModule } from "./modules/folder/index.js";
import {
  storageConnectionMigration,
  storageConnectionModule,
} from "./modules/storage-connection/index.js";

export type FileManagerApiOptions<Request> = {
  resolveContext: (
    request: Request,
  ) => FileManagerRequestContext | Promise<FileManagerRequestContext>;
};

export const fileManagerApiModuleKeys = [
  storageConnectionModule.key,
  folderModule.key,
  fileObjectModule.key,
] as const;

export async function registerFileManagerApi<Request>(
  app: unknown,
  options: FileManagerApiOptions<Request>,
) {
  await bootstrapFileManagerDatabase();
  await runFileManagerMigrations([
    storageConnectionMigration,
    folderMigration,
    fileObjectMigration,
  ]);
  if (!app || typeof (app as { register?: unknown }).register !== "function") {
    throw new Error("File Manager requires a Fastify host instance.");
  }
  const resolveContext = options.resolveContext as unknown as (
    request: FastifyRequest,
  ) => FileManagerRequestContext | Promise<FileManagerRequestContext>;
  await (app as FastifyInstance).register(async (fileManagerApp) => {
    await fileManagerApp.register(multipart);
    await storageConnectionModule.register(fileManagerApp, resolveContext);
    await folderModule.register(fileManagerApp, resolveContext);
    await fileObjectModule.register(fileManagerApp, resolveContext);
  });
}
