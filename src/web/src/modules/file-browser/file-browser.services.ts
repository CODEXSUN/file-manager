import { fileManagerRequest } from "../../request.js";
import type {
  ExternalFilePayload,
  FileObject,
  Folder,
} from "./file-browser.types.js";

export const listFolders = (parentUuid?: string) =>
  fileManagerRequest<Folder[]>(
    `/folders${parentUuid ? `?parentUuid=${parentUuid}` : ""}`,
  );
export const createFolder = (name: string, parentUuid?: string) =>
  fileManagerRequest<Folder>("/folders", {
    method: "POST",
    body: JSON.stringify({ name, parentUuid }),
  });
export const listFiles = (folderUuid?: string) =>
  fileManagerRequest<FileObject[]>(
    `/files${folderUuid ? `?folderUuid=${folderUuid}` : ""}`,
  );
export const uploadFile = (
  file: File,
  folderUuid?: string,
  connectionUuid?: string,
) => {
  const body = new FormData();
  body.set("file", file);
  if (folderUuid) body.set("folderUuid", folderUuid);
  if (connectionUuid) body.set("connectionUuid", connectionUuid);
  return fileManagerRequest<FileObject>("/files/upload", {
    method: "POST",
    body,
  });
};
export const linkFile = (body: ExternalFilePayload) =>
  fileManagerRequest<FileObject>("/files/link", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const deleteFile = (uuid: string) =>
  fileManagerRequest<{ deleted: true }>(`/files/${uuid}`, { method: "DELETE" });
