import type { FileManagerRequestContext } from "../../contracts.js";
import { getFileManagerDatabase } from "../../database/file-manager-database.js";
import type {
  FileObjectRecord,
  FileObjectTable,
  InternalFileObject,
} from "./file-object.types.js";

type Row = FileObjectTable & { id: number; created_at: Date; updated_at: Date };

export class FileObjectRepository {
  async list(context: FileManagerRequestContext, folderId: number | null) {
    const rows = await scope(context)
      .selectAll()
      .where("folder_id", folderId ? "=" : "is", folderId)
      .where("status", "=", "active")
      .orderBy("name")
      .execute();
    return Promise.all(rows.map((row) => this.toRecord(row as Row)));
  }

  async find(context: FileManagerRequestContext, uuid: string) {
    const row = await scope(context)
      .selectAll()
      .where("uuid", "=", uuid)
      .where("status", "=", "active")
      .executeTakeFirst();
    return row ? this.toInternal(row as Row) : undefined;
  }

  async create(input: {
    connectionId: number;
    context: FileManagerRequestContext;
    externalUrl: string | null;
    folderId: number | null;
    kind: "file" | "image";
    mimeType: string;
    name: string;
    providerKey: string;
    sizeBytes: number;
    uuid: string;
  }) {
    await getFileManagerDatabase()
      .insertInto("fm_files")
      .values({
        connection_id: input.connectionId,
        external_url: input.externalUrl,
        folder_id: input.folderId,
        host_key: input.context.host,
        kind: input.kind,
        mime_type: input.mimeType,
        name: input.name,
        provider_key: input.providerKey,
        size_bytes: input.sizeBytes,
        status: "active",
        tenant_id: input.context.tenantId,
        uuid: input.uuid,
      })
      .execute();
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    await getFileManagerDatabase()
      .updateTable("fm_files")
      .set({ status: "deleted" })
      .where("host_key", "=", context.host)
      .where("tenant_id", "=", context.tenantId)
      .where("uuid", "=", uuid)
      .execute();
  }

  async countInFolder(context: FileManagerRequestContext, folderId: number) {
    const result = await scope(context)
      .select((builder) => builder.fn.countAll<number>().as("count"))
      .where("folder_id", "=", folderId)
      .where("status", "=", "active")
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  private async toRecord(row: Row): Promise<FileObjectRecord> {
    const db = getFileManagerDatabase();
    const [connection, folder] = await Promise.all([
      db
        .selectFrom("fm_storage_connections")
        .select("uuid")
        .where("id", "=", row.connection_id)
        .executeTakeFirst(),
      row.folder_id
        ? db
            .selectFrom("fm_folders")
            .select("uuid")
            .where("id", "=", row.folder_id)
            .executeTakeFirst()
        : undefined,
    ]);
    return {
      connectionUuid: connection?.uuid ?? "",
      createdAt: new Date(row.created_at).toISOString(),
      downloadUrl: `/files/${row.uuid}/download`,
      folderUuid: folder?.uuid ?? null,
      kind: row.kind,
      mimeType: row.mime_type,
      name: row.name,
      sizeBytes: Number(row.size_bytes),
      updatedAt: new Date(row.updated_at).toISOString(),
      url: row.external_url ?? `/files/${row.uuid}/content`,
      uuid: row.uuid,
    };
  }

  private async toInternal(row: Row): Promise<InternalFileObject> {
    return {
      ...(await this.toRecord(row)),
      externalUrl: row.external_url,
      id: row.id,
      providerKey: row.provider_key,
    };
  }
}

function scope(context: FileManagerRequestContext) {
  return getFileManagerDatabase()
    .selectFrom("fm_files")
    .where("host_key", "=", context.host)
    .where("tenant_id", "=", context.tenantId);
}
