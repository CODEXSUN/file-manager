import { useQuery } from "@tanstack/react-query";
import {
  listStorageConnections,
  listStorageProviders,
} from "./storage-connection.services.js";
export const storageConnectionKey = ["file-manager", "connections"] as const;
export const storageProviderKey = ["file-manager", "providers"] as const;
export const useStorageConnections = () =>
  useQuery({ queryKey: storageConnectionKey, queryFn: listStorageConnections });
export const useStorageProviders = () =>
  useQuery({ queryKey: storageProviderKey, queryFn: listStorageProviders });
