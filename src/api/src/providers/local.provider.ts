import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileManagerEnv } from "../env.js";
import type { StoredObject } from "./provider.types.js";

export async function testLocalProvider() {
  await mkdir(fileManagerEnv.FILE_MANAGER_LOCAL_ROOT, { recursive: true });
}

export async function putLocalObject(
  key: string,
  body: Buffer,
): Promise<StoredObject> {
  const path = safeLocalPath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
  return { providerKey: key, publicUrl: null };
}

export function getLocalObject(key: string) {
  return readFile(safeLocalPath(key));
}

export async function deleteLocalObject(key: string) {
  await rm(safeLocalPath(key), { force: true });
}

function safeLocalPath(key: string) {
  const root = resolve(fileManagerEnv.FILE_MANAGER_LOCAL_ROOT);
  const path = resolve(root, key);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error("Storage key leaves the local root.");
  }
  return path;
}
