import { sql } from "kysely";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";

export const storageConnectionMigration = {
  key: "file-manager.storage-connection.v1",
  async run() {
    await sql`CREATE TABLE IF NOT EXISTS fm_storage_connections (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      host_key VARCHAR(32) NOT NULL,
      tenant_id VARCHAR(191) NOT NULL,
      name VARCHAR(191) NOT NULL,
      provider VARCHAR(32) NOT NULL,
      config_json JSON NOT NULL,
      credentials_cipher TEXT NOT NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY fm_storage_connection_name (host_key, tenant_id, name),
      INDEX fm_storage_connection_default (host_key, tenant_id, is_default, status)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`.execute(
      getFileManagerDatabase(),
    );
  },
} as const;
