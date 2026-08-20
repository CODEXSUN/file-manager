import type { Generated } from "kysely";
import type { FileManagerHost } from "@codexsun/file-manager-contracts";

export type FileObjectTable = {
  connection_id: number;
  created_at: Generated<Date>;
  external_url: string | null;
  folder_id: number | null;
  host_key: FileManagerHost;
  id: Generated<number>;
  kind: "file" | "image";
  mime_type: string;
  name: string;
  provider_key: string;
  size_bytes: number;
  status: "active" | "deleted";
  tenant_id: string;
  updated_at: Generated<Date>;
  uuid: string;
};

export type FileObjectRecord = {
  connectionUuid: string;
  createdAt: string;
  folderUuid: string | null;
  kind: "file" | "image";
  mimeType: string;
  name: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
  uuid: string;
};

export type InternalFileObject = FileObjectRecord & {
  externalUrl: string | null;
  id: number;
  providerKey: string;
};
