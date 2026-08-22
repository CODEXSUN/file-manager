import { createHash } from "node:crypto";
import { sql } from "kysely";
import { getFileManagerDatabase } from "./file-manager-database.js";

export type FileManagerMigration = {
  checksum: string;
  description: string;
  key: string;
  run: () => Promise<void>;
  version: number;
};

type LedgerStatus = "applied" | "failed" | "rolled_back" | "running";

type LedgerRow = {
  checksum: string;
  name: string;
  status: LedgerStatus;
  version: number;
};

const migrationScope = "file-manager";
const migrationBatch = 1;
const ledgerTable = "migration_schema";
const legacyLedgerTable = "fm_migration_schema_v1_legacy";

export async function runFileManagerMigrations(
  migrations: readonly FileManagerMigration[],
) {
  await withMigrationLock(async () => runMigrationsWithLedger(migrations));
}

async function runMigrationsWithLedger(
  migrations: readonly FileManagerMigration[],
) {
  await ensureMigrationLedger(migrations);

  for (const migration of migrations) {
    const checksum = migrationChecksum(migration);
    const existing = await findLedgerRow(migration.key);
    if (existing?.status === "applied") {
      assertCompatibleMigration(existing, migration, checksum);
      continue;
    }
    if (existing && existing.checksum !== checksum) {
      assertCompatibleMigration(existing, migration, checksum);
    }

    await writeLedgerState(migration, checksum, "running", null);
    try {
      await migration.run();
      await writeLedgerState(migration, checksum, "applied", null);
    } catch (error) {
      await writeLedgerState(
        migration,
        checksum,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}

async function withMigrationLock(run: () => Promise<void>) {
  const lockName = "file-manager:migrations";
  const database = getFileManagerDatabase();
  const acquired = await sql<{ acquired: number | string | null }>`
    SELECT GET_LOCK(${lockName}, 30) AS acquired
  `.execute(database);
  if (Number(acquired.rows[0]?.acquired ?? 0) !== 1) {
    throw new Error("Could not acquire the File Manager migration lock.");
  }
  try {
    await run();
  } finally {
    await sql`SELECT RELEASE_LOCK(${lockName})`.execute(database);
  }
}

async function ensureMigrationLedger(
  migrations: readonly FileManagerMigration[],
) {
  const tables = await listDatabaseTables();
  if (tables.has(ledgerTable)) {
    const columns = await listTableColumns(ledgerTable);
    if (columns.has("migration_key") && !columns.has("scope")) {
      await adoptLegacyLedger(tables, migrations);
      return;
    }
    assertStandardLedger(columns);
    if (tables.has(legacyLedgerTable)) {
      await importLegacyLedger(migrations);
    }
    return;
  }

  await createStandardLedger();
  if (tables.has(legacyLedgerTable)) {
    await importLegacyLedger(migrations);
  }
}

async function adoptLegacyLedger(
  tables: ReadonlySet<string>,
  migrations: readonly FileManagerMigration[],
) {
  if (tables.has(legacyLedgerTable)) {
    throw new Error(
      `Cannot adopt the legacy File Manager migration ledger because ${legacyLedgerTable} already exists.`,
    );
  }

  const db = getFileManagerDatabase();
  await sql
    .raw(`RENAME TABLE \`${ledgerTable}\` TO \`${legacyLedgerTable}\``)
    .execute(db);
  await createStandardLedger();
  await importLegacyLedger(migrations);
}

async function importLegacyLedger(migrations: readonly FileManagerMigration[]) {
  const db = getFileManagerDatabase();
  const legacyRows = await sql<{ applied_at: Date; migration_key: string }>`
    SELECT migration_key, applied_at FROM ${sql.table(legacyLedgerTable)} ORDER BY id
  `.execute(db);
  for (const row of legacyRows.rows) {
    if (await findLedgerRow(row.migration_key)) continue;
    const migration = migrations.find(
      (candidate) => candidate.key === row.migration_key,
    );
    const checksum = migration
      ? migrationChecksum(migration)
      : createHash("sha256")
          .update(`legacy:${row.migration_key}`)
          .digest("hex");
    const version = migration?.version ?? 1;
    const description =
      migration?.description ?? "Imported legacy File Manager migration.";
    await writeLedgerRow({
      appliedAt: row.applied_at,
      batch: migrationBatch,
      checksum,
      description,
      error: null,
      name: row.migration_key,
      status: "applied",
      version,
    });
  }
}

async function createStandardLedger() {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS \`${ledgerTable}\` (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    scope VARCHAR(80) NOT NULL,
    batch INT NOT NULL,
    version INT NOT NULL,
    name VARCHAR(191) NOT NULL,
    checksum CHAR(64) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL DEFAULT 'running',
    error_text TEXT NULL,
    created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
    started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    applied_at DATETIME(3) NULL,
    rolled_back_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY migration_schema_scope_name_unique(scope, name),
    INDEX migration_schema_batch_status_idx(scope, batch, status)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    .execute(getFileManagerDatabase());
}

async function findLedgerRow(name: string) {
  const result = await sql<LedgerRow>`
    SELECT checksum, name, status, version
    FROM ${sql.table(ledgerTable)}
    WHERE scope=${migrationScope} AND name=${name}
    LIMIT 1
  `.execute(getFileManagerDatabase());
  return result.rows[0];
}

async function writeLedgerState(
  migration: FileManagerMigration,
  checksum: string,
  status: LedgerStatus,
  error: string | null,
) {
  await writeLedgerRow({
    appliedAt: status === "applied" ? new Date() : null,
    batch: migrationBatch,
    checksum,
    description: migration.description,
    error,
    name: migration.key,
    status,
    version: migration.version,
  });
}

async function writeLedgerRow(value: {
  appliedAt: Date | null;
  batch: number;
  checksum: string;
  description: string;
  error: string | null;
  name: string;
  status: LedgerStatus;
  version: number;
}) {
  const uuid = createHash("sha256")
    .update(`${migrationScope}:${value.name}`)
    .digest("hex")
    .slice(0, 8);
  await sql`
    INSERT INTO ${sql.table(ledgerTable)}
      (uuid, scope, batch, version, name, checksum, description, status, error_text,
       created_by, started_at, applied_at, rolled_back_at)
    VALUES
      (${uuid}, ${migrationScope}, ${value.batch}, ${value.version}, ${value.name},
       ${value.checksum}, ${value.description}, ${value.status}, ${value.error},
       ${"system:file-manager-migration"}, CURRENT_TIMESTAMP(3), ${value.appliedAt}, NULL)
    ON DUPLICATE KEY UPDATE
      batch=VALUES(batch), version=VALUES(version), checksum=VALUES(checksum),
      description=VALUES(description), status=VALUES(status), error_text=VALUES(error_text),
      created_by=VALUES(created_by), started_at=VALUES(started_at),
      applied_at=VALUES(applied_at), rolled_back_at=VALUES(rolled_back_at)
  `.execute(getFileManagerDatabase());
}

async function listDatabaseTables() {
  const result = await sql<{ table_name: string }>`
    SELECT TABLE_NAME AS table_name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA=DATABASE()
  `.execute(getFileManagerDatabase());
  return new Set(result.rows.map((row) => row.table_name));
}

async function listTableColumns(tableName: string) {
  const result = await sql<{ column_name: string }>`
    SELECT COLUMN_NAME AS column_name
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=${tableName}
  `.execute(getFileManagerDatabase());
  return new Set(result.rows.map((row) => row.column_name));
}

function assertStandardLedger(columns: ReadonlySet<string>) {
  const required = [
    "uuid",
    "scope",
    "batch",
    "version",
    "name",
    "checksum",
    "description",
    "status",
    "error_text",
    "created_by",
    "started_at",
    "applied_at",
    "rolled_back_at",
    "created_at",
    "updated_at",
  ];
  const missing = required.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(
      `File Manager requires the standard migration_schema ledger. Missing columns: ${missing.join(", ")}.`,
    );
  }
}

function migrationChecksum(migration: FileManagerMigration) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        checksum: migration.checksum,
        key: migration.key,
        scope: migrationScope,
        version: migration.version,
      }),
    )
    .digest("hex");
}

function assertCompatibleMigration(
  existing: LedgerRow,
  migration: FileManagerMigration,
  checksum: string,
) {
  if (
    existing.version !== migration.version ||
    existing.checksum !== checksum
  ) {
    throw new Error(
      `File Manager migration ${migration.key} differs from the applied checksum or version.`,
    );
  }
}
