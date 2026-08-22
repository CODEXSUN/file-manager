import { sql } from "kysely";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";
import type { FileManagerMigration } from "../../database/migration.js";

const createFilesTable = `CREATE TABLE IF NOT EXISTS fm_files (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(8) NOT NULL UNIQUE,
  host_key VARCHAR(32) NOT NULL,
  tenant_id VARCHAR(191) NOT NULL,
  folder_id INT NULL,
  connection_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  mime_type VARCHAR(191) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  provider_key VARCHAR(1024) NOT NULL,
  external_url TEXT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX fm_file_folder (host_key, tenant_id, folder_id, status, name),
  INDEX fm_file_connection (connection_id, status),
  CONSTRAINT fm_file_folder_fk FOREIGN KEY (folder_id) REFERENCES fm_folders(id) ON DELETE RESTRICT,
  CONSTRAINT fm_file_connection_fk FOREIGN KEY (connection_id) REFERENCES fm_storage_connections(id) ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

export const fileObjectMigration = {
  checksum: createFilesTable,
  description: "Create tenant-scoped file and image metadata.",
  key: "file-manager.file-object.v1",
  async run() {
    await sql.raw(createFilesTable).execute(getFileManagerDatabase());
  },
  version: 1,
} as const satisfies FileManagerMigration;
