import { sql } from "kysely";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";
import type { FileManagerMigration } from "../../database/migration.js";

const createFoldersTable = `CREATE TABLE IF NOT EXISTS fm_folders (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(8) NOT NULL UNIQUE,
  host_key VARCHAR(32) NOT NULL,
  tenant_id VARCHAR(191) NOT NULL,
  parent_id INT NULL,
  name VARCHAR(191) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY fm_folder_name (host_key, tenant_id, parent_id, name),
  INDEX fm_folder_parent (host_key, tenant_id, parent_id, status),
  CONSTRAINT fm_folder_parent_fk FOREIGN KEY (parent_id) REFERENCES fm_folders(id) ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

export const folderMigration = {
  checksum: createFoldersTable,
  description: "Create tenant-scoped File Manager folders.",
  key: "file-manager.folder.v1",
  async run() {
    await sql.raw(createFoldersTable).execute(getFileManagerDatabase());
  },
  version: 1,
} as const satisfies FileManagerMigration;
