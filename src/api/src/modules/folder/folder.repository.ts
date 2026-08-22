import { randomBytes } from "node:crypto";
import type { FileManagerRequestContext } from "../../contracts.js";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";
import type { FolderRecord, FolderTable } from "./folder.types.js";

type Row = FolderTable & { id: number; created_at: Date; updated_at: Date };

export class FolderRepository {
  async list(context: FileManagerRequestContext, parentUuid: string | null) {
    const parent = parentUuid
      ? await this.find(context, parentUuid)
      : undefined;
    const rows = await scope(context)
      .selectAll()
      .where("parent_id", parent ? "=" : "is", parent?.id ?? null)
      .where("status", "=", "active")
      .orderBy("name")
      .execute();
    return Promise.all(rows.map((row) => this.toRecord(context, row as Row)));
  }

  async find(context: FileManagerRequestContext, uuid: string) {
    return scope(context)
      .selectAll()
      .where("uuid", "=", uuid)
      .where("status", "=", "active")
      .executeTakeFirst() as Promise<Row | undefined>;
  }

  async create(
    context: FileManagerRequestContext,
    name: string,
    parentId: number | null,
  ) {
    const uuid = randomBytes(4).toString("hex");
    await getFileManagerDatabase()
      .insertInto("fm_folders")
      .values({
        host_key: context.host,
        name,
        parent_id: parentId,
        status: "active",
        tenant_id: context.tenantId,
        uuid,
      })
      .execute();
    return uuid;
  }

  async rename(context: FileManagerRequestContext, uuid: string, name: string) {
    await getFileManagerDatabase()
      .updateTable("fm_folders")
      .set({ name })
      .where("host_key", "=", context.host)
      .where("tenant_id", "=", context.tenantId)
      .where("uuid", "=", uuid)
      .where("status", "=", "active")
      .execute();
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    await getFileManagerDatabase()
      .updateTable("fm_folders")
      .set({ status: "deleted" })
      .where("host_key", "=", context.host)
      .where("tenant_id", "=", context.tenantId)
      .where("uuid", "=", uuid)
      .execute();
  }

  async countFiles(context: FileManagerRequestContext, folderId: number) {
    const result = await getFileManagerDatabase()
      .selectFrom("fm_files")
      .select(({ fn }) => fn.countAll<number>().as("total"))
      .where("host_key", "=", context.host)
      .where("tenant_id", "=", context.tenantId)
      .where("folder_id", "=", folderId)
      .where("status", "=", "active")
      .executeTakeFirstOrThrow();
    return Number(result.total);
  }

  private async toRecord(
    context: FileManagerRequestContext,
    row: Row,
  ): Promise<FolderRecord> {
    const parent = row.parent_id
      ? await scope(context)
          .select("uuid")
          .where("id", "=", row.parent_id)
          .executeTakeFirst()
      : undefined;
    return {
      createdAt: new Date(row.created_at).toISOString(),
      name: row.name,
      parentUuid: parent?.uuid ?? null,
      updatedAt: new Date(row.updated_at).toISOString(),
      uuid: row.uuid,
    };
  }
}

function scope(context: FileManagerRequestContext) {
  return getFileManagerDatabase()
    .selectFrom("fm_folders")
    .where("host_key", "=", context.host)
    .where("tenant_id", "=", context.tenantId);
}
