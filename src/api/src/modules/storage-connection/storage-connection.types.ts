import type { Generated } from "kysely";
import type { FileManagerHost, StorageProvider } from "../../contracts.js";

export type StorageConnectionTable = {
  config_json: string;
  created_at: Generated<Date>;
  credentials_cipher: string;
  host_key: FileManagerHost;
  id: Generated<number>;
  is_default: number;
  name: string;
  provider: StorageProvider;
  status: "active" | "inactive";
  tenant_id: string;
  updated_at: Generated<Date>;
  uuid: string;
};

export type StorageConnectionInput = {
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  isDefault: boolean;
  name: string;
  provider: StorageProvider;
  status: "active" | "inactive";
};

export type StorageConnectionRecord = {
  config: Record<string, unknown>;
  createdAt: string;
  hasCredentials: boolean;
  isDefault: boolean;
  name: string;
  provider: StorageProvider;
  status: "active" | "inactive";
  updatedAt: string;
  uuid: string;
};

export type InternalStorageConnection = StorageConnectionRecord & {
  credentials: Record<string, unknown>;
  id: number;
};
