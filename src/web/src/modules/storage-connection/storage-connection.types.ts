export type StorageProvider =
  "local" | "external_url" | "s3" | "cloudflare_r2" | "google_drive";
export type StorageConnection = {
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
export type StorageConnectionPayload = {
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  isDefault: boolean;
  name: string;
  provider: StorageProvider;
  status: "active" | "inactive";
};
