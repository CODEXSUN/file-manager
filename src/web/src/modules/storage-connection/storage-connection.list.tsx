import { Cloud, Database, ExternalLink, Folder } from "lucide-react";
import type { StorageConnection } from "./storage-connection.types.js";

export function StorageConnectionList({
  records,
  onEdit,
  onTest,
}: {
  records: StorageConnection[];
  onEdit: (record: StorageConnection) => void;
  onTest: (record: StorageConnection) => void;
}) {
  if (!records.length)
    return (
      <p className="file-manager-empty">
        No storage connections are configured.
      </p>
    );
  return (
    <div className="file-manager-grid">
      {records.map((record) => {
        const Icon = providerIcon(record.provider);
        return (
          <article className="file-manager-card" key={record.uuid}>
            <header>
              <Icon size={21} />
              <span className="file-manager-badge">
                {record.isDefault ? "Default" : record.status}
              </span>
            </header>
            <strong>{record.name}</strong>
            <p>{providerLabel(record.provider)}</p>
            <div className="file-manager-actions">
              <button
                className="file-manager-button"
                data-variant="outline"
                onClick={() => onTest(record)}
              >
                Test
              </button>
              <button
                className="file-manager-button"
                data-variant="outline"
                onClick={() => onEdit(record)}
              >
                Edit
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function providerIcon(provider: StorageConnection["provider"]) {
  if (provider === "local") return Folder;
  if (provider === "external_url") return ExternalLink;
  if (provider === "google_drive") return Cloud;
  return Database;
}

function providerLabel(provider: StorageConnection["provider"]) {
  return {
    cloudflare_r2: "Cloudflare R2",
    external_url: "External URL",
    google_drive: "Google Drive",
    local: "Local storage",
    s3: "Amazon S3",
  }[provider];
}
