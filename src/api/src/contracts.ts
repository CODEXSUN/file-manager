export const FILE_MANAGER_PLUGIN_KEY = "codexsun.file-manager" as const;
export const FILE_MANAGER_ADDON_KIND = "composable-addon-application" as const;
export const FILE_MANAGER_BUILT_IN_PROVIDERS = [
  "local",
  "external_url",
  "s3",
  "cloudflare_r2",
  "google_drive",
] as const;

export type FileManagerHost = string;
export type FileManagerDatabaseMode = "dedicated" | "shared-host";
export type FileManagerRuntimeMode = "multi-tenant" | "single-database";
export type BuiltInStorageProvider =
  (typeof FILE_MANAGER_BUILT_IN_PROVIDERS)[number];
export type StorageProvider = string;

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
  compatibleHosts: "host-adapter";
  databaseModes: readonly FileManagerDatabaseMode[];
  displayName: "File Manager";
  kind: typeof FILE_MANAGER_ADDON_KIND;
  key: typeof FILE_MANAGER_PLUGIN_KEY;
  packages: {
    api: "@codexsun/file-manager/api";
    contracts: "@codexsun/file-manager/contracts";
    web: "@codexsun/file-manager/web";
  };
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
  compatibleHosts: "host-adapter",
  databaseModes: ["dedicated", "shared-host"],
  displayName: "File Manager",
  kind: FILE_MANAGER_ADDON_KIND,
  key: FILE_MANAGER_PLUGIN_KEY,
  packages: {
    api: "@codexsun/file-manager/api",
    contracts: "@codexsun/file-manager/contracts",
    web: "@codexsun/file-manager/web",
  },
  version: "1.1.1",
};
