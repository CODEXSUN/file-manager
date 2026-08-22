import { useState } from "react";
import { storageConnectionSchema } from "./storage-connection.schema.js";
import type {
  StorageConnection,
  StorageConnectionPayload,
  StorageProvider,
  StorageProviderDescriptor,
  StorageProviderField,
} from "./storage-connection.types.js";

export function StorageConnectionForm({
  providers,
  record,
  saving,
  onCancel,
  onSubmit,
}: {
  providers: StorageProviderDescriptor[];
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
  const descriptor = providers.find((value) => value.key === provider);

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
            onChange={(event) => {
              setProvider(event.target.value as StorageProvider);
              setConfig({});
              setCredentials({});
            }}
          >
            {providers.map((value) => (
              <option key={value.key} value={value.key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        {descriptor?.fields.map((field) => (
          <ProviderField
            field={field}
            key={`${field.target}:${field.key}`}
            value={
              field.target === "config"
                ? config[field.key]
                : credentials[field.key]
            }
            onChange={(value) => {
              if (field.target === "config") {
                setConfig((current) => ({ ...current, [field.key]: value }));
              } else {
                setCredentials((current) => ({
                  ...current,
                  [field.key]: value,
                }));
              }
            }}
          />
        ))}
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

function ProviderField({
  field,
  onChange,
  value,
}: {
  field: StorageProviderField;
  onChange: (value: boolean | string) => void;
  value: unknown;
}) {
  if (field.type === "boolean") {
    return (
      <label className="file-manager-field">
        <span>{field.label}</span>
        <input
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </label>
    );
  }
  return (
    <Field
      label={`${field.label}${field.required ? " *" : ""}`}
      type={field.type}
      value={text(value)}
      onChange={onChange}
    />
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
