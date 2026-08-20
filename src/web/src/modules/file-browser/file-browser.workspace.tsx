import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FolderPlus, Link, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { ExternalFileForm } from "./file-browser.form.js";
import { fileBrowserKey, useFileBrowser } from "./file-browser.hooks.js";
import { FileBrowserList } from "./file-browser.list.js";
import {
  createFolder,
  deleteFile,
  linkFile,
  uploadFile,
} from "./file-browser.services.js";
import type {
  ExternalFilePayload,
  FileObject,
  Folder,
} from "./file-browser.types.js";
import "../../file-manager.css";

export function FileBrowserWorkspace() {
  const [path, setPath] = useState<Folder[]>([]);
  const [linking, setLinking] = useState(false);
  const folder = path.at(-1);
  const browser = useFileBrowser(folder?.uuid);
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const refresh = () =>
    client.invalidateQueries({ queryKey: fileBrowserKey(folder?.uuid) });
  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file, folder?.uuid),
    onSuccess: async () => {
      await refresh();
      toast.success("File uploaded");
    },
    onError: showError("File could not be uploaded"),
  });
  const addLink = useMutation({
    mutationFn: linkFile,
    onSuccess: async () => {
      await refresh();
      setLinking(false);
      toast.success("External file added");
    },
    onError: showError("External file could not be added"),
  });
  const remove = useMutation({
    mutationFn: (file: FileObject) => deleteFile(file.uuid),
    onSuccess: async () => {
      await refresh();
      toast.success("File deleted");
    },
    onError: showError("File could not be deleted"),
  });
  const addFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    try {
      await createFolder(name, folder?.uuid);
      await refresh();
      toast.success("Folder created");
    } catch (error) {
      toast.error("Folder could not be created", {
        description: message(error),
      });
    }
  };
  if (linking)
    return (
      <div className="file-manager-page">
        <ExternalFileForm
          saving={addLink.isPending}
          onCancel={() => setLinking(false)}
          onSubmit={(value: ExternalFilePayload) => addLink.mutate(value)}
          {...(folder?.uuid ? { folderUuid: folder.uuid } : {})}
        />
      </div>
    );
  return (
    <main className="file-manager-page">
      <header className="file-manager-header">
        <div>
          <h1>File Manager</h1>
          <p>
            {path.length
              ? `Files / ${path.map((item) => item.name).join(" / ")}`
              : "Images, documents, folders, and external files."}
          </p>
        </div>
        <div className="file-manager-actions">
          {path.length ? (
            <button
              className="file-manager-button"
              data-variant="outline"
              onClick={() => setPath((current) => current.slice(0, -1))}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : null}
          <button
            className="file-manager-button"
            data-variant="outline"
            onClick={() =>
              void Promise.all([
                browser.files.refetch(),
                browser.folders.refetch(),
              ])
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="file-manager-button"
            data-variant="outline"
            onClick={() => void addFolder()}
          >
            <FolderPlus size={16} />
            New folder
          </button>
          <button
            className="file-manager-button"
            data-variant="outline"
            onClick={() => setLinking(true)}
          >
            <Link size={16} />
            Add link
          </button>
          <button
            className="file-manager-button"
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            Upload
          </button>
          <input
            hidden
            ref={input}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.target.value = "";
            }}
          />
        </div>
      </header>
      <section className="file-manager-panel">
        <FileBrowserList
          files={browser.files.data ?? []}
          folders={browser.folders.data ?? []}
          onDelete={(file) => remove.mutate(file)}
          onOpenFolder={(next) => setPath((current) => [...current, next])}
        />
      </section>
    </main>
  );
}

function showError(title: string) {
  return (error: Error) => toast.error(title, { description: error.message });
}
function message(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
