import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { fileManagerEnv } from "../env.js";
import type { ProviderConnection, StoredObject } from "./provider.types.js";

export async function testProvider(connection: ProviderConnection) {
  switch (connection.provider) {
    case "local":
      await mkdir(fileManagerEnv.FILE_MANAGER_LOCAL_ROOT, { recursive: true });
      return;
    case "external_url":
      requiredUrl(connection.config.publicBaseUrl, "Public base URL");
      return;
    case "s3":
    case "cloudflare_r2":
      await s3Client(connection).send(
        new HeadBucketCommand({
          Bucket: requiredText(connection.config.bucket, "Bucket"),
        }),
      );
      return;
    case "google_drive": {
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=user",
        {
          headers: {
            authorization: `Bearer ${requiredText(connection.credentials.accessToken, "Access token")}`,
          },
        },
      );
      if (!response.ok)
        throw new Error(
          `Google Drive connection failed with ${response.status}.`,
        );
    }
  }
}

export async function putProviderObject(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  switch (connection.provider) {
    case "local":
      return putLocal(key, body);
    case "s3":
    case "cloudflare_r2":
      return putS3(connection, key, body, contentType);
    case "google_drive":
      return putGoogleDrive(connection, key, body, contentType);
    case "external_url":
      throw new Error("External URL connections accept links but not uploads.");
  }
}

export async function getProviderObject(
  connection: ProviderConnection,
  key: string,
) {
  switch (connection.provider) {
    case "local":
      return readFile(safeLocalPath(key));
    case "s3":
    case "cloudflare_r2": {
      const result = await s3Client(connection).send(
        new GetObjectCommand({
          Bucket: requiredText(connection.config.bucket, "Bucket"),
          Key: key,
        }),
      );
      return Buffer.from(await result.Body!.transformToByteArray());
    }
    case "google_drive": {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}?alt=media`,
        {
          headers: {
            authorization: `Bearer ${requiredText(connection.credentials.accessToken, "Access token")}`,
          },
        },
      );
      if (!response.ok)
        throw new Error(
          `Google Drive download failed with ${response.status}.`,
        );
      return Buffer.from(await response.arrayBuffer());
    }
    case "external_url":
      throw new Error("External links do not proxy remote content.");
  }
}

export async function deleteProviderObject(
  connection: ProviderConnection,
  key: string,
) {
  switch (connection.provider) {
    case "local":
      await rm(safeLocalPath(key), { force: true });
      return;
    case "s3":
    case "cloudflare_r2":
      await s3Client(connection).send(
        new DeleteObjectCommand({
          Bucket: requiredText(connection.config.bucket, "Bucket"),
          Key: key,
        }),
      );
      return;
    case "google_drive": {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}`,
        {
          headers: {
            authorization: `Bearer ${requiredText(connection.credentials.accessToken, "Access token")}`,
          },
          method: "DELETE",
        },
      );
      if (!response.ok && response.status !== 404) {
        throw new Error(`Google Drive delete failed with ${response.status}.`);
      }
      return;
    }
    case "external_url":
      return;
  }
}

async function putLocal(key: string, body: Buffer): Promise<StoredObject> {
  const path = safeLocalPath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
  return { providerKey: key, publicUrl: null };
}

async function putS3(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  await s3Client(connection).send(
    new PutObjectCommand({
      Body: body,
      Bucket: requiredText(connection.config.bucket, "Bucket"),
      ContentType: contentType,
      Key: key,
    }),
  );
  const base = optionalUrl(connection.config.publicBaseUrl);
  return {
    providerKey: key,
    publicUrl: base ? `${base}/${encodePath(key)}` : null,
  };
}

async function putGoogleDrive(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  const boundary = `file-manager-${Date.now()}`;
  const metadata = JSON.stringify({
    name: key.split("/").at(-1),
    parents: connection.config.rootFolderId
      ? [connection.config.rootFolderId]
      : undefined,
  });
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
    body,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink",
    {
      body: payload,
      headers: {
        authorization: `Bearer ${requiredText(connection.credentials.accessToken, "Access token")}`,
        "content-type": `multipart/related; boundary=${boundary}`,
      },
      method: "POST",
    },
  );
  if (!response.ok)
    throw new Error(`Google Drive upload failed with ${response.status}.`);
  const result = (await response.json()) as {
    id: string;
    webContentLink?: string;
  };
  return { providerKey: result.id, publicUrl: result.webContentLink ?? null };
}

function s3Client(connection: ProviderConnection) {
  const endpoint = optionalUrl(connection.config.endpoint);
  return new S3Client({
    credentials: {
      accessKeyId: requiredText(
        connection.credentials.accessKeyId,
        "Access key ID",
      ),
      secretAccessKey: requiredText(
        connection.credentials.secretAccessKey,
        "Secret access key",
      ),
    },
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: Boolean(connection.config.forcePathStyle),
    region: requiredText(connection.config.region, "Region"),
  });
}

function safeLocalPath(key: string) {
  const root = resolve(fileManagerEnv.FILE_MANAGER_LOCAL_ROOT);
  const path = resolve(root, key);
  if (path !== root && !path.startsWith(`${root}${sep}`))
    throw new Error("Storage key leaves the local root.");
  return path;
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label} is required.`);
  return value.trim();
}

function requiredUrl(value: unknown, label: string) {
  const url = optionalUrl(value);
  if (!url) throw new Error(`${label} is required.`);
  return url;
}

function optionalUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Storage URLs must use HTTP or HTTPS.");
  return url.toString().replace(/\/$/u, "");
}

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}
