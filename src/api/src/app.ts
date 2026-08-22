import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
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
import {
  validatedFileManagerContextResolver,
  type ResolveFileManagerContext,
} from "./host.js";
import {
  registerStorageProvider,
  type StorageProviderAdapter,
} from "./providers/provider-runtime.js";

export type FileManagerApiOptions = {
  providers?: readonly StorageProviderAdapter[];
  resolveContext: ResolveFileManagerContext;
};

export const fileManagerApiModuleKeys = [
  storageConnectionModule.key,
  folderModule.key,
  fileObjectModule.key,
] as const;

export async function registerFileManagerApi(
  app: FastifyInstance,
  options: FileManagerApiOptions,
) {
  if (!app || typeof app.register !== "function") {
    throw new Error("File Manager requires a Fastify host instance.");
  }
  if (!options || typeof options.resolveContext !== "function") {
    throw new Error("File Manager requires a trusted host context resolver.");
  }

  const resolveContext = validatedFileManagerContextResolver(
    options.resolveContext,
  );
  for (const provider of options.providers ?? []) {
    registerStorageProvider(provider);
  }
  await bootstrapFileManagerDatabase();
  await runFileManagerMigrations([
    storageConnectionMigration,
    folderMigration,
    fileObjectMigration,
  ]);
  await app.register(async (fileManagerApp) => {
    await fileManagerApp.register(multipart);
    await storageConnectionModule.register(fileManagerApp, resolveContext);
    await folderModule.register(fileManagerApp, resolveContext);
    await fileObjectModule.register(fileManagerApp, resolveContext);
  });
}
