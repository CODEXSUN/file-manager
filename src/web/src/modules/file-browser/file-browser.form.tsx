import { useState } from "react";
import { externalFileSchema } from "./file-browser.schema.js";
import type { ExternalFilePayload } from "./file-browser.types.js";

export function ExternalFileForm({
  folderUuid,
  onCancel,
  onSubmit,
  saving,
}: {
  folderUuid?: string;
  onCancel: () => void;
  onSubmit: (value: ExternalFilePayload) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [error, setError] = useState("");
  const submit = () => {
    const result = externalFileSchema.safeParse({
      mimeType,
      name,
      url,
      ...(folderUuid ? { folderUuid } : {}),
    });
    if (!result.success)
      return setError(
        result.error.issues[0]?.message ?? "Check the link fields.",
      );
    onSubmit({
      mimeType: result.data.mimeType,
      name: result.data.name,
      url: result.data.url,
      ...(result.data.connectionUuid
        ? { connectionUuid: result.data.connectionUuid }
        : {}),
      ...(result.data.folderUuid ? { folderUuid: result.data.folderUuid } : {}),
    });
  };
  return (
    <section className="file-manager-panel file-manager-form">
      <h2>Add external file</h2>
      {error ? <p className="file-manager-error">{error}</p> : null}
      <div className="file-manager-form-grid">
        <Field label="File name" value={name} onChange={setName} />
        <Field label="Public URL" value={url} onChange={setUrl} />
        <Field label="MIME type" value={mimeType} onChange={setMimeType} />
      </div>
      <div className="file-manager-actions">
        <button
          className="file-manager-button"
          data-variant="outline"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="file-manager-button"
          disabled={saving}
          onClick={submit}
        >
          {saving ? "Adding..." : "Add file"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="file-manager-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
