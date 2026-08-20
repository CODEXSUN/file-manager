import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { fileManagerEnv } from "../env.js";
import type { FileObjectTable } from "../modules/file-object/file-object.types.js";
import type { FolderTable } from "../modules/folder/folder.types.js";
import type { StorageConnectionTable } from "../modules/storage-connection/storage-connection.types.js";

export type FileManagerDatabase = {
  fm_files: FileObjectTable;
  fm_folders: FolderTable;
  fm_storage_connections: StorageConnectionTable;
  migration_schema: {
    applied_at: Date;
    id: number;
    migration_key: string;
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
  const databaseName = fileManagerEnv.FILE_MANAGER_DB_NAME;
  if (!/^[A-Za-z0-9_]+$/u.test(databaseName)) {
    throw new Error(
      "FILE_MANAGER_DB_NAME must contain only letters, numbers, and underscores.",
    );
  }
  const connection = await createConnection({
    host: fileManagerEnv.FILE_MANAGER_DB_HOST,
    password: fileManagerEnv.FILE_MANAGER_DB_PASSWORD,
    port: fileManagerEnv.FILE_MANAGER_DB_PORT,
    user: fileManagerEnv.FILE_MANAGER_DB_USER,
  });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await connection.end();
  }
  const db = getFileManagerDatabase();
  await sql`CREATE TABLE IF NOT EXISTS migration_schema (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    migration_key VARCHAR(191) NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`.execute(db);
}

export async function closeFileManagerDatabase() {
  await database?.destroy();
  database = undefined;
}
