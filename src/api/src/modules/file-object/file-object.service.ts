import { randomBytes } from "node:crypto";
import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";
import {
  deleteProviderObject,
  getProviderObject,
  putProviderObject,
} from "../../providers/provider-runtime.js";
import { FolderService } from "../folder/folder.service.js";
import { StorageConnectionService } from "../storage-connection/storage-connection.service.js";
import { FileObjectRepository } from "./file-object.repository.js";

export class FileObjectService {
  constructor(
    private readonly repository = new FileObjectRepository(),
    private readonly folders = new FolderService(),
    private readonly connections = new StorageConnectionService(),
  ) {}

  async list(context: FileManagerRequestContext, folderUuid: string | null) {
    const folder = folderUuid
      ? await this.folders.required(context, folderUuid)
      : undefined;
    return this.repository.list(context, folder?.id ?? null);
  }

  async upload(input: {
    body: Buffer;
    connectionUuid?: string;
    context: FileManagerRequestContext;
    folderUuid?: string;
    mimeType: string;
    name: string;
  }) {
    const name = safeName(input.name);
    const folder = input.folderUuid
      ? await this.folders.required(input.context, input.folderUuid)
      : undefined;
    const connection = await this.connections.getInternal(
      input.context,
      input.connectionUuid,
    );
    if (connection.status !== "active")
      throw new Error("The selected storage connection is inactive.");
    const uuid = randomBytes(4).toString("hex");
    const key = `${input.context.host}/${safeSegment(input.context.tenantId)}/${folder?.uuid ?? "root"}/${uuid}-${name}`;
    const stored = await putProviderObject(
      connection,
      key,
      input.body,
      input.mimeType,
    );
    await this.repository.create({
      connectionId: connection.id,
      context: input.context,
      externalUrl: stored.publicUrl,
      folderId: folder?.id ?? null,
      kind: input.mimeType.startsWith("image/") ? "image" : "file",
      mimeType: input.mimeType,
      name,
      providerKey: stored.providerKey,
      sizeBytes: input.body.length,
      uuid,
    });
    return this.required(input.context, uuid);
  }

  async link(input: {
    connectionUuid?: string;
    context: FileManagerRequestContext;
    folderUuid?: string;
    mimeType: string;
    name: string;
    url: string;
  }) {
    const url = new URL(input.url);
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("External files must use HTTP or HTTPS.");
    const folder = input.folderUuid
      ? await this.folders.required(input.context, input.folderUuid)
      : undefined;
    const connection = await this.connections.getInternal(
      input.context,
      input.connectionUuid,
    );
    const uuid = randomBytes(4).toString("hex");
    await this.repository.create({
      connectionId: connection.id,
      context: input.context,
      externalUrl: url.toString(),
      folderId: folder?.id ?? null,
      kind: input.mimeType.startsWith("image/") ? "image" : "file",
      mimeType: input.mimeType,
      name: safeName(input.name),
      providerKey: url.toString(),
      sizeBytes: 0,
      uuid,
    });
    return this.required(input.context, uuid);
  }

  async content(context: FileManagerRequestContext, uuid: string) {
    const file = await this.required(context, uuid);
    if (file.externalUrl)
      return { mimeType: file.mimeType, redirect: file.externalUrl } as const;
    const connection = await this.connections.getInternal(
      context,
      file.connectionUuid,
    );
    return {
      body: await getProviderObject(connection, file.providerKey),
      mimeType: file.mimeType,
    } as const;
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    const file = await this.required(context, uuid);
    const connection = await this.connections.getInternal(
      context,
      file.connectionUuid,
    );
    await deleteProviderObject(connection, file.providerKey);
    await this.repository.remove(context, uuid);
    return { deleted: true as const };
  }

  private async required(context: FileManagerRequestContext, uuid: string) {
    const file = await this.repository.find(context, uuid);
    if (!file) throw new Error("File was not found.");
    return file;
  }
}

function safeName(value: string) {
  const name = value.trim().replace(/[\\/]/gu, "-");
  if (!name || name === "." || name === "..")
    throw new Error("File name is invalid.");
  return name.slice(0, 255);
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/gu, "-").slice(0, 191);
}
