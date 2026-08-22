import {
  deleteGoogleDriveObject,
  getGoogleDriveObject,
  putGoogleDriveObject,
  testGoogleDriveProvider,
} from "./google-drive.provider.js";
import {
  deleteLocalObject,
  getLocalObject,
  putLocalObject,
  testLocalProvider,
} from "./local.provider.js";
import { builtInProviderDescriptors } from "./provider-descriptors.js";
import {
  assertStorageProviderAvailable,
  customStorageProvider,
  listStorageProviderDescriptors,
  registerStorageProvider,
} from "./provider-registry.js";
import { requiredUrl } from "./provider-utils.js";
import {
  deleteS3Object,
  getS3Object,
  putS3Object,
  testS3Provider,
} from "./s3.provider.js";
import type {
  ProviderConnection,
  StorageProviderAdapter,
  StoredObject,
} from "./provider.types.js";

export { registerStorageProvider };
export type { StorageProviderAdapter };

export function availableStorageProviders() {
  return listStorageProviderDescriptors(builtInProviderDescriptors);
}

export function validateStorageProvider(provider: string) {
  assertStorageProviderAvailable(provider);
}

export function validateStorageProviderConfiguration(
  connection: ProviderConnection,
) {
  validateStorageProvider(connection.provider);
  const descriptor = availableStorageProviders().find(
    (provider) => provider.key === connection.provider,
  );
  for (const field of descriptor?.fields ?? []) {
    if (!field.required) continue;
    const source =
      field.target === "config" ? connection.config : connection.credentials;
    const value = source[field.key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`${field.label} is required for ${descriptor?.label}.`);
    }
  }
}

export async function testProvider(connection: ProviderConnection) {
  const custom = customStorageProvider(connection.provider);
  if (custom) return custom.test(connection);
  switch (connection.provider) {
    case "local":
      return testLocalProvider();
    case "external_url":
      requiredUrl(connection.config.publicBaseUrl, "Public base URL");
      return;
    case "s3":
    case "cloudflare_r2":
      return testS3Provider(connection);
    case "google_drive":
      return testGoogleDriveProvider(connection);
    default:
      throw unregisteredProvider(connection.provider);
  }
}

export async function putProviderObject(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  const custom = customStorageProvider(connection.provider);
  if (custom) {
    if (!custom.putObject) {
      throw new Error(
        `Storage provider ${connection.provider} does not accept uploads.`,
      );
    }
    return custom.putObject(connection, key, body, contentType);
  }
  switch (connection.provider) {
    case "local":
      return putLocalObject(key, body);
    case "s3":
    case "cloudflare_r2":
      return putS3Object(connection, key, body, contentType);
    case "google_drive":
      return putGoogleDriveObject(connection, key, body, contentType);
    case "external_url":
      throw new Error("External URL connections accept links but not uploads.");
    default:
      throw unregisteredProvider(connection.provider);
  }
}

export async function getProviderObject(
  connection: ProviderConnection,
  key: string,
) {
  const custom = customStorageProvider(connection.provider);
  if (custom) {
    if (!custom.getObject) {
      throw new Error(
        `Storage provider ${connection.provider} does not expose file content.`,
      );
    }
    return custom.getObject(connection, key);
  }
  switch (connection.provider) {
    case "local":
      return getLocalObject(key);
    case "s3":
    case "cloudflare_r2":
      return getS3Object(connection, key);
    case "google_drive":
      return getGoogleDriveObject(connection, key);
    case "external_url":
      throw new Error("External links do not proxy remote content.");
    default:
      throw unregisteredProvider(connection.provider);
  }
}

export async function deleteProviderObject(
  connection: ProviderConnection,
  key: string,
) {
  const custom = customStorageProvider(connection.provider);
  if (custom) {
    await custom.deleteObject?.(connection, key);
    return;
  }
  switch (connection.provider) {
    case "local":
      return deleteLocalObject(key);
    case "s3":
    case "cloudflare_r2":
      return deleteS3Object(connection, key);
    case "google_drive":
      return deleteGoogleDriveObject(connection, key);
    case "external_url":
      return;
    default:
      throw unregisteredProvider(connection.provider);
  }
}

function unregisteredProvider(provider: string) {
  return new Error(`Storage provider ${provider} is not registered.`);
}
