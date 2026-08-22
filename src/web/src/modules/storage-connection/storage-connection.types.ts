export type StorageProvider = string;
export type StorageProviderField = {
  key: string;
  label: string;
  required: boolean;
  target: "config" | "credentials";
  type: "boolean" | "password" | "text" | "url";
};
export type StorageProviderDescriptor = {
  fields: StorageProviderField[];
  key: StorageProvider;
  label: string;
  supportsUpload: boolean;
};
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
