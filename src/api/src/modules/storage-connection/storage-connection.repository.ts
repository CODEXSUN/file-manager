import { randomBytes } from "node:crypto";
import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";
import type { Selectable, Transaction } from "kysely";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";
import type { FileManagerDatabase } from "../../database/file-manager-database.js";
import { openCredentials } from "../../security/credential-vault.js";
import type {
  InternalStorageConnection,
  StorageConnectionInput,
  StorageConnectionRecord,
  StorageConnectionTable,
} from "./storage-connection.types.js";

type Row = Selectable<StorageConnectionTable>;

export class StorageConnectionRepository {
  async list(context: FileManagerRequestContext) {
    const rows = await scoped(context).selectAll().orderBy("name").execute();
    return rows.map((row) => toRecord(row));
  }

  async find(context: FileManagerRequestContext, uuid: string) {
    const row = await scoped(context)
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toInternal(row as Row) : undefined;
  }

  async findDefault(context: FileManagerRequestContext) {
    const row = await scoped(context)
      .selectAll()
      .where("is_default", "=", 1)
      .where("status", "=", "active")
      .executeTakeFirst();
    return row ? toInternal(row as Row) : undefined;
  }

  async create(
    context: FileManagerRequestContext,
    input: StorageConnectionInput,
    cipher: string,
  ) {
    const db = getFileManagerDatabase();
    return db.transaction().execute(async (transaction) => {
      if (input.isDefault) await clearDefault(transaction, context);
      const uuid = randomBytes(4).toString("hex");
      await transaction
        .insertInto("fm_storage_connections")
        .values({
          config_json: JSON.stringify(input.config),
          credentials_cipher: cipher,
          host_key: context.host,
          is_default: input.isDefault ? 1 : 0,
          name: input.name,
          provider: input.provider,
          status: input.status,
          tenant_id: context.tenantId,
          uuid,
        })
        .execute();
      return uuid;
    });
  }

  async update(
    context: FileManagerRequestContext,
    uuid: string,
    input: StorageConnectionInput,
    cipher: string,
  ) {
    const db = getFileManagerDatabase();
    await db.transaction().execute(async (transaction) => {
      if (input.isDefault) await clearDefault(transaction, context);
      await transaction
        .updateTable("fm_storage_connections")
        .set({
          config_json: JSON.stringify(input.config),
          credentials_cipher: cipher,
          is_default: input.isDefault ? 1 : 0,
          name: input.name,
          provider: input.provider,
          status: input.status,
        })
        .where("host_key", "=", context.host)
        .where("tenant_id", "=", context.tenantId)
        .where("uuid", "=", uuid)
        .execute();
    });
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    return scopedDelete(context).where("uuid", "=", uuid).executeTakeFirst();
  }
}

function scoped(context: FileManagerRequestContext) {
  return getFileManagerDatabase()
    .selectFrom("fm_storage_connections")
    .where("host_key", "=", context.host)
    .where("tenant_id", "=", context.tenantId);
}

function scopedDelete(context: FileManagerRequestContext) {
  return getFileManagerDatabase()
    .deleteFrom("fm_storage_connections")
    .where("host_key", "=", context.host)
    .where("tenant_id", "=", context.tenantId);
}

async function clearDefault(
  transaction: Transaction<FileManagerDatabase>,
  context: FileManagerRequestContext,
) {
  await transaction
    .updateTable("fm_storage_connections")
    .set({ is_default: 0 })
    .where("host_key", "=", context.host)
    .where("tenant_id", "=", context.tenantId)
    .execute();
}

function toRecord(row: Row): StorageConnectionRecord {
  return {
    config: JSON.parse(row.config_json) as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString(),
    hasCredentials: Boolean(row.credentials_cipher),
    isDefault: Boolean(row.is_default),
    name: row.name,
    provider: row.provider,
    status: row.status,
    updatedAt: new Date(row.updated_at).toISOString(),
    uuid: row.uuid,
  };
}

function toInternal(row: Row): InternalStorageConnection {
  return {
    ...toRecord(row),
    credentials: openCredentials(row.credentials_cipher),
    id: row.id,
  };
}
