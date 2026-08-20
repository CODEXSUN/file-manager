import { useQuery } from "@tanstack/react-query";
import { listStorageConnections } from "./storage-connection.services.js";
export const storageConnectionKey = ["file-manager", "connections"] as const;
export const useStorageConnections = () =>
  useQuery({ queryKey: storageConnectionKey, queryFn: listStorageConnections });
