import type { FileManagerRequestContext } from "@codexsun/file-manager-contracts";
import {
  testProvider,
  validateStorageProviderConfiguration,
} from "../../providers/provider-runtime.js";
import { sealCredentials } from "../../security/credential-vault.js";
import { StorageConnectionRepository } from "./storage-connection.repository.js";
import type { StorageConnectionInput } from "./storage-connection.types.js";

export class StorageConnectionService {
  constructor(
    private readonly repository = new StorageConnectionRepository(),
  ) {}

  async list(context: FileManagerRequestContext) {
    await this.ensureDefault(context);
    return this.repository.list(context);
  }

  async create(
    context: FileManagerRequestContext,
    input: StorageConnectionInput,
  ) {
    validate(input, input.credentials ?? {});
    const uuid = await this.repository.create(
      context,
      input,
      sealCredentials(input.credentials ?? {}),
    );
    return this.get(context, uuid);
  }

  async update(
    context: FileManagerRequestContext,
    uuid: string,
    input: StorageConnectionInput,
  ) {
    const current = await this.required(context, uuid);
    const credentials = Object.keys(input.credentials ?? {}).length
      ? (input.credentials ?? {})
      : current.credentials;
    validate(input, credentials);
    await this.repository.update(
      context,
      uuid,
      input,
      sealCredentials(credentials),
    );
    return this.get(context, uuid);
  }

  async test(context: FileManagerRequestContext, uuid: string) {
    const connection = await this.required(context, uuid);
    await testProvider(connection);
    return { connected: true as const };
  }

  async remove(context: FileManagerRequestContext, uuid: string) {
    const connection = await this.required(context, uuid);
    if (connection.isDefault)
      throw new Error("The default storage connection cannot be deleted.");
    await this.repository.remove(context, uuid);
    return { deleted: true as const };
  }

  async getInternal(context: FileManagerRequestContext, uuid?: string) {
    let value = uuid
      ? await this.repository.find(context, uuid)
      : await this.repository.findDefault(context);
    if (!value && !uuid) {
      await this.ensureDefault(context);
      value = await this.repository.findDefault(context);
    }
    if (!value) throw new Error("An active storage connection is required.");
    return value;
  }

  private async get(context: FileManagerRequestContext, uuid: string) {
    const {
      credentials: _credentials,
      id: _id,
      ...record
    } = await this.required(context, uuid);
    return record;
  }

  private async required(context: FileManagerRequestContext, uuid: string) {
    const connection = await this.repository.find(context, uuid);
    if (!connection) throw new Error("Storage connection was not found.");
    return connection;
  }

  private async ensureDefault(context: FileManagerRequestContext) {
    if (await this.repository.findDefault(context)) return;
    await this.repository.ensureLocalDefault(context, sealCredentials({}));
  }
}

function validate(
  input: StorageConnectionInput,
  credentials: Record<string, unknown>,
) {
  if (!input.name.trim()) throw new Error("Connection name is required.");
  validateStorageProviderConfiguration({
    config: input.config,
    credentials,
    provider: input.provider,
  });
  if (input.provider === "external_url" && !input.config.publicBaseUrl) {
    throw new Error("External URL storage requires a public base URL.");
  }
  if (["s3", "cloudflare_r2"].includes(input.provider)) {
    for (const key of ["bucket", "region"] as const) {
      if (!input.config[key])
        throw new Error(`${key} is required for ${input.provider}.`);
    }
  }
}
