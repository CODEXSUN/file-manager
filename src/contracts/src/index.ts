export const FILE_MANAGER_PLUGIN_KEY = "codexsun.file-manager" as const;

export type FileManagerHost = "cxapp" | "techmedia" | "cxshop";
export type StorageProvider =
  "local" | "external_url" | "s3" | "cloudflare_r2" | "google_drive";

export type FileManagerRequestContext = {
  actorId: string;
  host: FileManagerHost;
  tenantId: string;
};

export type FileManagerPluginManifest = {
  apiPrefix: "/file-manager";
  capabilities: readonly [
    "files",
    "images",
    "folders",
    "external-links",
    "storage-connections",
  ];
  compatibleHosts: readonly FileManagerHost[];
  key: typeof FILE_MANAGER_PLUGIN_KEY;
  version: string;
};

export const fileManagerPluginManifest: FileManagerPluginManifest = {
  apiPrefix: "/file-manager",
  capabilities: [
    "files",
    "images",
    "folders",
    "external-links",
    "storage-connections",
  ],
  compatibleHosts: ["cxapp", "techmedia", "cxshop"],
  key: FILE_MANAGER_PLUGIN_KEY,
  version: "1.0.0",
};
