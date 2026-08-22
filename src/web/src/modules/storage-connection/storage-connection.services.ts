import { fileManagerRequest } from "../../request.js";
import type {
  StorageConnection,
  StorageConnectionPayload,
  StorageProviderDescriptor,
} from "./storage-connection.types.js";
export const listStorageProviders = () =>
  fileManagerRequest<StorageProviderDescriptor[]>("/providers");
export const listStorageConnections = () =>
  fileManagerRequest<StorageConnection[]>("/connections");
export const createStorageConnection = (body: StorageConnectionPayload) =>
  fileManagerRequest<StorageConnection>("/connections", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateStorageConnection = (
  uuid: string,
  body: StorageConnectionPayload,
) =>
  fileManagerRequest<StorageConnection>(`/connections/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const testStorageConnection = (uuid: string) =>
  fileManagerRequest<{ connected: true }>(`/connections/${uuid}/test`, {
    method: "POST",
  });
export const deleteStorageConnection = (uuid: string) =>
  fileManagerRequest<{ deleted: true }>(`/connections/${uuid}`, {
    method: "DELETE",
  });
