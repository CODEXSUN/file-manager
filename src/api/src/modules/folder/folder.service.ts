import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";
import { FolderRepository } from "./folder.repository.js";

export class FolderService {
  constructor(private readonly repository = new FolderRepository()) {}

  list(context: FileManagerRequestContext, parentUuid: string | null) {
    return this.repository.list(context, parentUuid);
  }

  async create(
    context: FileManagerRequestContext,
    name: string,
    parentUuid: string | null,
  ) {
    const parent = parentUuid
      ? await this.required(context, parentUuid)
      : undefined;
    const uuid = await this.repository.create(
      context,
      cleanName(name),
      parent?.id ?? null,
    );
    return this.required(context, uuid).then(toPublic);
  }

  async rename(context: FileManagerRequestContext, uuid: string, name: string) {
    await this.required(context, uuid);
    await this.repository.rename(context, uuid, cleanName(name));
    return this.required(context, uuid).then(toPublic);
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    const folder = await this.required(context, uuid);
    const children = await this.repository.list(context, uuid);
    if (children.length)
      throw new Error(
        "Move or delete child folders before deleting this folder.",
      );
    if (await this.repository.countFiles(context, folder.id)) {
      throw new Error("Move or delete files before deleting this folder.");
    }
    await this.repository.remove(context, uuid);
    return { deleted: true as const };
  }

  required(context: FileManagerRequestContext, uuid: string) {
    return this.repository.find(context, uuid).then((folder) => {
      if (!folder) throw new Error("Folder was not found.");
      return folder;
    });
  }
}

function cleanName(value: string) {
  const name = value.trim();
  if (!name || name === "." || name === ".." || /[\\/]/u.test(name)) {
    throw new Error("Folder name is invalid.");
  }
  return name;
}

function toPublic(folder: Awaited<ReturnType<FolderService["required"]>>) {
  return { name: folder.name, uuid: folder.uuid };
}
