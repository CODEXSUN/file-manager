import { useState } from "react";
import { storageConnectionSchema } from "./storage-connection.schema.js";
import type {
  StorageConnection,
  StorageConnectionPayload,
  StorageProvider,
} from "./storage-connection.types.js";

export function StorageConnectionForm({
  record,
  saving,
  onCancel,
  onSubmit,
}: {
  record: StorageConnection | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (payload: StorageConnectionPayload) => void;
}) {
  const [name, setName] = useState(record?.name ?? "");
  const [provider, setProvider] = useState<StorageProvider>(
    record?.provider ?? "local",
  );
  const [config, setConfig] = useState<Record<string, unknown>>(
    record?.config ?? {},
  );
  const [credentials, setCredentials] = useState<Record<string, unknown>>({});
  const [isDefault, setDefault] = useState(record?.isDefault ?? false);
  const [error, setError] = useState("");

  const submit = () => {
    const result = storageConnectionSchema.safeParse({
      config,
      credentials,
      isDefault,
      name,
      provider,
      status: record?.status ?? "active",
    });
    if (!result.success) {
      setError(
        result.error.issues[0]?.message ?? "Check the connection fields.",
      );
      return;
    }
    onSubmit({
      config: result.data.config,
      isDefault: result.data.isDefault,
      name: result.data.name,
      provider: result.data.provider,
      status: result.data.status,
      ...(result.data.credentials
        ? { credentials: result.data.credentials }
        : {}),
    });
  };

  return (
    <section className="file-manager-panel file-manager-form">
      <h2>{record ? "Edit storage connection" : "New storage connection"}</h2>
      {error ? <p className="file-manager-error">{error}</p> : null}
      <div className="file-manager-form-grid">
        <Field label="Name" value={name} onChange={setName} />
        <label className="file-manager-field">
          <span>Provider</span>
          <select
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as StorageProvider)
            }
          >
            <option value="local">Local storage</option>
            <option value="external_url">External URL</option>
            <option value="s3">Amazon S3</option>
            <option value="cloudflare_r2">Cloudflare R2</option>
            <option value="google_drive">Google Drive</option>
          </select>
        </label>
        {provider !== "local" ? (
          <Field
            label="Public base URL"
            value={text(config.publicBaseUrl)}
            onChange={(value) => setConfig({ ...config, publicBaseUrl: value })}
          />
        ) : null}
        {["s3", "cloudflare_r2"].includes(provider) ? (
          <>
            <Field
              label="Endpoint"
              value={text(config.endpoint)}
              onChange={(value) => setConfig({ ...config, endpoint: value })}
            />
            <Field
              label="Bucket"
              value={text(config.bucket)}
              onChange={(value) => setConfig({ ...config, bucket: value })}
            />
            <Field
              label="Region"
              value={text(config.region)}
              onChange={(value) => setConfig({ ...config, region: value })}
            />
            <Field
              label="Access key ID"
              value={text(credentials.accessKeyId)}
              onChange={(value) =>
                setCredentials({ ...credentials, accessKeyId: value })
              }
            />
            <Field
              label="Secret access key"
              type="password"
              value={text(credentials.secretAccessKey)}
              onChange={(value) =>
                setCredentials({ ...credentials, secretAccessKey: value })
              }
            />
          </>
        ) : null}
        {provider === "google_drive" ? (
          <>
            <Field
              label="Root folder ID"
              value={text(config.rootFolderId)}
              onChange={(value) =>
                setConfig({ ...config, rootFolderId: value })
              }
            />
            <Field
              label="OAuth access token"
              type="password"
              value={text(credentials.accessToken)}
              onChange={(value) =>
                setCredentials({ ...credentials, accessToken: value })
              }
            />
          </>
        ) : null}
      </div>
      <label>
        <input
          checked={isDefault}
          onChange={(event) => setDefault(event.target.checked)}
          type="checkbox"
        />{" "}
        Default connection
      </label>
      <div className="file-manager-actions">
        <button
          className="file-manager-button"
          data-variant="outline"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="file-manager-button"
          disabled={saving}
          onClick={submit}
          type="button"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="file-manager-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
