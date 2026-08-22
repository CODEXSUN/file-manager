# File Manager integration

Install `@codexsun/file-manager` at an exact release tag. File Manager is a
composable add-on application: the host registers its Fastify API plugin, mounts
its React workspaces, and consumes only its public contracts.

The host must provide a trusted `FileManagerRequestContext`. Resolve the scope
and actor from the verified server session. Set `host` to the stable lowercase
application key, such as `cxapp`, `cxshop`, or another registered application.
File Manager does not maintain a host allow-list. Do not accept the host or
scope identifier from request input.

File Manager owns its `fm_*` tables, provider records, and local storage root.
CXApp uses a dedicated File Manager database and supplies the authenticated
tenant identity. CXShop reuses its fixed application database and supplies a
stable server-owned application scope. File Manager never selects a tenant or
database from browser input.

The host must provision the configured database before registration. File
Manager deliberately does not request `CREATE DATABASE` permission. This lets a
restricted CXShop application user reuse the existing database and lets CXApp
keep its dedicated database lifecycle in the Platform host.

Both database modes use the standard `migration_schema` ledger. File Manager
records migrations under the `file-manager` scope with version and checksum
validation. A v1 standalone File Manager database with the legacy
`migration_key` ledger is adopted once and retained as
`fm_migration_schema_v1_legacy` for recovery evidence.

Configure every `FILE_MANAGER_*` setting before the API starts. The API fails
when a setting is missing, invalid, or cannot connect.

`FILE_MANAGER_LOCAL_ROOT` is resolved from the host process root. Use
`./storage/file-manager` for local development or an absolute persistent volume
in deployment. Every object key includes the application and trusted scope, so
applications can share the physical root without sharing files.

## Provider add-ons

The API includes Local, external URL, Amazon S3, Cloudflare R2, and Google Drive
providers. A host can pass additional `StorageProviderAdapter` implementations
to `registerFileManagerApi(app, { providers, resolveContext })`. Each adapter owns
its public configuration fields, secret credential fields, connection test,
upload, read, and delete behavior. File Manager stores its credentials encrypted
and exposes only the provider descriptor to the web workspace.

The web package discovers providers from `/file-manager/providers`. It does not
need a code change when a host registers another adapter such as Azure Blob,
OneDrive, Dropbox, or a private object store.

## File URLs

API file records return route-relative content and download URLs. The web package
resolves them through `configureFileManagerClient({ baseUrl })`, so the same file
browser works under `/api/platform/file-manager` or any other host mount path.
Absolute external URLs remain unchanged.

Provider secrets are encrypted before MariaDB writes. API responses never
return a secret. Host applications use file UUIDs and public routes only.

Run File Manager migrations before routes become available. Back up the File
Manager database and local storage before an upgrade.
