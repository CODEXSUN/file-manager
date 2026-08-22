import type { StorageProviderDescriptor } from "./provider.types.js";

export const builtInProviderDescriptors: readonly StorageProviderDescriptor[] =
  [
    { fields: [], key: "local", label: "Local storage", supportsUpload: true },
    {
      fields: [
        field("publicBaseUrl", "Public base URL", "config", "url", true),
      ],
      key: "external_url",
      label: "External URL",
      supportsUpload: false,
    },
    s3Descriptor("s3", "Amazon S3"),
    s3Descriptor("cloudflare_r2", "Cloudflare R2"),
    {
      fields: [
        field("rootFolderId", "Root folder ID", "config", "text", false),
        field(
          "accessToken",
          "OAuth access token",
          "credentials",
          "password",
          false,
        ),
        field("clientId", "OAuth client ID", "credentials", "text", false),
        field(
          "clientSecret",
          "OAuth client secret",
          "credentials",
          "password",
          false,
        ),
        field(
          "refreshToken",
          "OAuth refresh token",
          "credentials",
          "password",
          false,
        ),
      ],
      key: "google_drive",
      label: "Google Drive",
      supportsUpload: true,
    },
  ];

function s3Descriptor(
  key: "cloudflare_r2" | "s3",
  label: string,
): StorageProviderDescriptor {
  return {
    fields: [
      field("bucket", "Bucket", "config", "text", true),
      field("region", "Region", "config", "text", true),
      field("endpoint", "Endpoint", "config", "url", false),
      field("publicBaseUrl", "Public base URL", "config", "url", false),
      field("forcePathStyle", "Force path style", "config", "boolean", false),
      field("accessKeyId", "Access key ID", "credentials", "text", true),
      field(
        "secretAccessKey",
        "Secret access key",
        "credentials",
        "password",
        true,
      ),
    ],
    key,
    label,
    supportsUpload: true,
  };
}

function field(
  key: string,
  label: string,
  target: "config" | "credentials",
  type: "boolean" | "password" | "text" | "url",
  required: boolean,
) {
  return { key, label, required, target, type } as const;
}
