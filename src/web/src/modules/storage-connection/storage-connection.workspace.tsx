import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StorageConnectionForm } from "./storage-connection.form.js";
import {
  storageConnectionKey,
  useStorageConnections,
} from "./storage-connection.hooks.js";
import { StorageConnectionList } from "./storage-connection.list.js";
import {
  createStorageConnection,
  testStorageConnection,
  updateStorageConnection,
} from "./storage-connection.services.js";
import type {
  StorageConnection,
  StorageConnectionPayload,
} from "./storage-connection.types.js";
import "../../file-manager.css";

export function StorageConnectionsWorkspace() {
  const query = useStorageConnections();
  const client = useQueryClient();
  const [editing, setEditing] = useState<
    StorageConnection | null | undefined
  >();
  const save = useMutation({
    mutationFn: (payload: StorageConnectionPayload) =>
      editing
        ? updateStorageConnection(editing.uuid, payload)
        : createStorageConnection(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: storageConnectionKey });
      setEditing(undefined);
      toast.success("Storage connection saved");
    },
    onError: (error) =>
      toast.error("Connection could not be saved", {
        description: error.message,
      }),
  });
  const test = useMutation({
    mutationFn: (record: StorageConnection) =>
      testStorageConnection(record.uuid),
    onSuccess: () => toast.success("Storage connection is available"),
    onError: (error) =>
      toast.error("Connection test failed", { description: error.message }),
  });
  if (editing !== undefined)
    return (
      <div className="file-manager-page">
        <StorageConnectionForm
          record={editing}
          saving={save.isPending}
          onCancel={() => setEditing(undefined)}
          onSubmit={(value) => save.mutate(value)}
        />
      </div>
    );
  return (
    <main className="file-manager-page">
      <header className="file-manager-header">
        <div>
          <h1>Storage connections</h1>
          <p>Connect Local, URL, S3, R2, and Google Drive storage.</p>
        </div>
        <div className="file-manager-actions">
          <button
            className="file-manager-button"
            data-variant="outline"
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="file-manager-button"
            onClick={() => setEditing(null)}
          >
            <Plus size={16} />
            New connection
          </button>
        </div>
      </header>
      <section className="file-manager-panel">
        <StorageConnectionList
          records={query.data ?? []}
          onEdit={setEditing}
          onTest={(record) => test.mutate(record)}
        />
      </section>
    </main>
  );
}
