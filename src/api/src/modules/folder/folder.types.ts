import type { Generated } from "kysely";
import type { FileManagerHost } from "../../contracts.js";

export type FolderTable = {
  created_at: Generated<Date>;
  host_key: FileManagerHost;
  id: Generated<number>;
  name: string;
  parent_id: number | null;
  status: "active" | "deleted";
  tenant_id: string;
  updated_at: Generated<Date>;
  uuid: string;
};

export type FolderRecord = {
  createdAt: string;
  name: string;
  parentUuid: string | null;
  updatedAt: string;
  uuid: string;
};
