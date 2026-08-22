import type { StorageProvider } from "@codexsun/file-manager-contracts";

export type ProviderConnection = {
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  provider: StorageProvider;
};

export type StoredObject = {
  providerKey: string;
  publicUrl: string | null;
};

export type StorageProviderField = {
  key: string;
  label: string;
  required: boolean;
  target: "config" | "credentials";
  type: "boolean" | "password" | "text" | "url";
};

export type StorageProviderDescriptor = {
  fields: readonly StorageProviderField[];
  key: StorageProvider;
  label: string;
  supportsUpload: boolean;
};

export type StorageProviderAdapter = {
  deleteObject?: (connection: ProviderConnection, key: string) => Promise<void>;
  descriptor: StorageProviderDescriptor;
  getObject?: (connection: ProviderConnection, key: string) => Promise<Buffer>;
  putObject?: (
    connection: ProviderConnection,
    key: string,
    body: Buffer,
    contentType: string,
  ) => Promise<StoredObject>;
  test: (connection: ProviderConnection) => Promise<void>;
};
