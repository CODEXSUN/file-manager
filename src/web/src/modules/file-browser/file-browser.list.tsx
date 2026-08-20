import { File, Folder as FolderIcon, Image } from "lucide-react";
import type { FileObject, Folder } from "./file-browser.types.js";

export function FileBrowserList({
  files,
  folders,
  onDelete,
  onOpenFolder,
}: {
  files: FileObject[];
  folders: Folder[];
  onDelete: (file: FileObject) => void;
  onOpenFolder: (folder: Folder) => void;
}) {
  if (!files.length && !folders.length)
    return <p className="file-manager-empty">This folder is empty.</p>;
  return (
    <div className="file-manager-grid">
      {folders.map((folder) => (
        <button
          className="file-manager-card"
          key={folder.uuid}
          onClick={() => onOpenFolder(folder)}
        >
          <header>
            <FolderIcon size={22} />
            <span className="file-manager-badge">Folder</span>
          </header>
          <strong>{folder.name}</strong>
        </button>
      ))}
      {files.map((file) => (
        <article className="file-manager-card" key={file.uuid}>
          {file.kind === "image" ? (
            <img
              alt={file.name}
              className="file-manager-image"
              src={file.url}
            />
          ) : null}
          <header>
            {file.kind === "image" ? <Image size={21} /> : <File size={21} />}
            <span className="file-manager-badge">{size(file.sizeBytes)}</span>
          </header>
          <strong>{file.name}</strong>
          <p>{file.mimeType}</p>
          <div className="file-manager-actions">
            <a
              className="file-manager-button"
              data-variant="outline"
              href={file.url}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
            <button
              className="file-manager-button"
              data-variant="outline"
              onClick={() => onDelete(file)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function size(bytes: number) {
  if (!bytes) return "Link";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
