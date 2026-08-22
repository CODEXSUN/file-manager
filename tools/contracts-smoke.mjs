import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const localRoot = resolve("storage", "contract-smoke");
Object.assign(process.env, {
  FILE_MANAGER_DB_HOST: "127.0.0.1",
  FILE_MANAGER_DB_NAME: "file_manager_contract_smoke",
  FILE_MANAGER_DB_PASSWORD: "not-used",
  FILE_MANAGER_DB_PORT: "3306",
  FILE_MANAGER_DB_USER: "not-used",
  FILE_MANAGER_ENCRYPTION_KEY: "contract-smoke-key-at-least-32-bytes",
  FILE_MANAGER_LOCAL_ROOT: localRoot,
  FILE_MANAGER_MAX_UPLOAD_BYTES: "1048576",
});

const { validatedFileManagerContextResolver } =
  await import("../dist/api/host.js");
const {
  availableStorageProviders,
  deleteProviderObject,
  getProviderObject,
  putProviderObject,
  registerStorageProvider,
} = await import("../dist/api/providers/provider-runtime.js");

const resolveContext = validatedFileManagerContextResolver(async () => ({
  actorId: "smoke-user",
  host: "inventory-app",
  tenantId: "smoke-tenant",
}));
assert.deepEqual(await resolveContext({}), {
  actorId: "smoke-user",
  host: "inventory-app",
  tenantId: "smoke-tenant",
});

await assert.rejects(
  validatedFileManagerContextResolver(async () => ({
    actorId: "smoke-user",
    host: "Invalid Host",
    tenantId: "smoke-tenant",
  }))({}),
);

registerStorageProvider({
  descriptor: {
    fields: [],
    key: "azure_blob",
    label: "Azure Blob Storage",
    supportsUpload: true,
  },
  async test() {},
});
assert.ok(
  availableStorageProviders().some((provider) => provider.key === "azure_blob"),
);

const localConnection = { config: {}, credentials: {}, provider: "local" };
const localKey = "inventory-app/smoke-tenant/root/12345678-sample.txt";
await putProviderObject(
  localConnection,
  localKey,
  Buffer.from("central file manager"),
  "text/plain",
);
assert.equal(
  (await getProviderObject(localConnection, localKey)).toString(),
  "central file manager",
);
await deleteProviderObject(localConnection, localKey);
await rm(localRoot, { force: true, recursive: true });

console.log("File Manager host, provider, and local storage contracts passed.");
