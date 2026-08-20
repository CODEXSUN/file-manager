import { useQuery } from "@tanstack/react-query";
import { listFiles, listFolders } from "./file-browser.services.js";
export const fileBrowserKey = (folderUuid?: string) =>
  ["file-manager", "browser", folderUuid ?? "root"] as const;
export const useFileBrowser = (folderUuid?: string) => {
  const folders = useQuery({
    queryKey: [...fileBrowserKey(folderUuid), "folders"],
    queryFn: () => listFolders(folderUuid),
  });
  const files = useQuery({
    queryKey: [...fileBrowserKey(folderUuid), "files"],
    queryFn: () => listFiles(folderUuid),
  });
  return { files, folders };
};
