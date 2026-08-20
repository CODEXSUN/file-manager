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
