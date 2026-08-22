import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { fileManagerEnv } from "../env.js";
import type { FileObjectTable } from "../modules/file-object/file-object.types.js";
import type { FolderTable } from "../modules/folder/folder.types.js";
import type { StorageConnectionTable } from "../modules/storage-connection/storage-connection.types.js";

export type FileManagerDatabase = {
  fm_files: FileObjectTable;
  fm_folders: FolderTable;
  fm_storage_connections: StorageConnectionTable;
  migration_schema: {
    applied_at: Date | null;
    batch: number;
    checksum: string;
    created_at: Date;
    created_by: string;
    description: string;
    error_text: string | null;
    id: number;
    name: string;
    rolled_back_at: Date | null;
    scope: string;
    started_at: Date;
    status: "applied" | "failed" | "rolled_back" | "running";
    updated_at: Date;
    uuid: string;
    version: number;
  };
};

let database: Kysely<FileManagerDatabase> | undefined;

export function getFileManagerDatabase() {
  database ??= new Kysely<FileManagerDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: fileManagerEnv.FILE_MANAGER_DB_NAME,
        host: fileManagerEnv.FILE_MANAGER_DB_HOST,
        password: fileManagerEnv.FILE_MANAGER_DB_PASSWORD,
        port: fileManagerEnv.FILE_MANAGER_DB_PORT,
        user: fileManagerEnv.FILE_MANAGER_DB_USER,
      }),
    }),
  });
  return database;
}

export async function bootstrapFileManagerDatabase() {
  await sql`SELECT 1`.execute(getFileManagerDatabase());
}

export async function closeFileManagerDatabase() {
  await database?.destroy();
  database = undefined;
}
