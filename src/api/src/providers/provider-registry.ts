import { FILE_MANAGER_BUILT_IN_PROVIDERS } from "@codexsun/file-manager-contracts";
import type {
  StorageProviderAdapter,
  StorageProviderDescriptor,
} from "./provider.types.js";

const providerKeyPattern = /^[a-z][a-z0-9_-]{1,31}$/u;
const customProviders = new Map<string, StorageProviderAdapter>();

export function registerStorageProvider(adapter: StorageProviderAdapter) {
  const key = adapter.descriptor.key.trim();
  if (!providerKeyPattern.test(key)) {
    throw new Error(`Storage provider key ${key || "(empty)"} is invalid.`);
  }
  if (isBuiltInStorageProvider(key) || customProviders.has(key)) {
    throw new Error(`Storage provider ${key} is already registered.`);
  }
  customProviders.set(key, {
    ...adapter,
    descriptor: { ...adapter.descriptor, key },
  });
}

export function customStorageProvider(key: string) {
  return customProviders.get(key);
}

export function listStorageProviderDescriptors(
  builtIns: readonly StorageProviderDescriptor[],
) {
  return [
    ...builtIns,
    ...[...customProviders.values()].map((provider) => provider.descriptor),
  ];
}

export function assertStorageProviderAvailable(key: string) {
  if (!isBuiltInStorageProvider(key) && !customProviders.has(key)) {
    throw new Error(`Storage provider ${key} is not registered.`);
  }
}

function isBuiltInStorageProvider(key: string) {
  return (FILE_MANAGER_BUILT_IN_PROVIDERS as readonly string[]).includes(key);
}
