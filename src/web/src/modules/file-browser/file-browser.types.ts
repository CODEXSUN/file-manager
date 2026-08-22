export type Folder = {
  createdAt: string;
  name: string;
  parentUuid: string | null;
  updatedAt: string;
  uuid: string;
};
export type FileObject = {
  connectionUuid: string;
  createdAt: string;
  downloadUrl: string;
  folderUuid: string | null;
  kind: "file" | "image";
  mimeType: string;
  name: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
  uuid: string;
};
export type ExternalFilePayload = {
  connectionUuid?: string;
  folderUuid?: string;
  mimeType: string;
  name: string;
  url: string;
};
