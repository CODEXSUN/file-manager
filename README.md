# CODEXSUN File Manager

File Manager is a composable add-on application for CODEXSUN products. It owns
storage connections, encrypted provider credentials, folders, file metadata,
uploads, external links, and image browsing.

The package includes Local storage, external URLs, Amazon S3, Cloudflare R2,
and Google Drive. Other storage systems register through the public provider
adapter contract. Any CODEXSUN application can connect through the public API,
web, and contract exports. Host applications must not write File Manager tables
or read provider credentials.

## Integration name

- Product name: **File Manager**
- Application ID: `file-manager`
- Package name: `@codexsun/file-manager`
- Architecture: **composable add-on application**
- Runtime adapters: Fastify API plugin, React workspace package, and host-neutral contracts

The host supplies a lowercase application key and a trusted scope from its
authenticated server context. File Manager does not keep an application
allow-list. Local objects are isolated below
`FILE_MANAGER_LOCAL_ROOT/<application>/<scope>/...`; the recommended root is
`./storage/file-manager`.

It is installed as a package, registered as a backend plugin, and shown to users
as an optional application. Calling it only a plugin would hide its owned data,
migrations, routes, UI, and lifecycle.

## Packages

- `@codexsun/file-manager/api` registers the Fastify plugin and migrations.
- `@codexsun/file-manager/web` exports the file and connection workspaces.
- `@codexsun/file-manager/contracts` exports the host-neutral plugin contract.

The file browser supports folders, images, documents, uploads, external links,
inline content, and downloads. Storage Connections discovers built-in and
host-registered providers from the API.

See `docs/integration.md` for host registration and environment settings.
