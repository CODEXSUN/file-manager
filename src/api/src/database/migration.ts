import { sql } from "kysely";
import { getFileManagerDatabase } from "./file-manager-database.js";

export type FileManagerMigration = {
  key: string;
  run: () => Promise<void>;
};

export async function runFileManagerMigrations(
  migrations: readonly FileManagerMigration[],
) {
  const db = getFileManagerDatabase();
  for (const migration of migrations) {
    const applied = await db
      .selectFrom("migration_schema")
      .select(sql<number>`COUNT(*)`.as("count"))
      .where("migration_key", "=", migration.key)
      .executeTakeFirst();
    if (Number(applied?.count ?? 0) > 0) continue;
    await migration.run();
    await sql`INSERT INTO migration_schema (migration_key) VALUES (${migration.key})`.execute(
      db,
    );
  }
}
