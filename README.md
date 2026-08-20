# CODEXSUN File Manager

File Manager is the shared storage application for CODEXSUN products. It owns
storage connections, encrypted provider credentials, folders, file metadata,
uploads, external links, and image browsing.

The package supports Local storage, external URLs, Amazon S3, Cloudflare R2,
and Google Drive. CXApp, TechMedia, and CXShop connect through public API, web,
and contract exports. Host applications must not write File Manager tables or
read provider credentials.

## Packages

- `@codexsun/file-manager/api` registers the Fastify plugin and migrations.
- `@codexsun/file-manager/web` exports the file and connection workspaces.
- `@codexsun/file-manager/contracts` exports the host-neutral plugin contract.

See `docs/integration.md` for host registration and environment settings.
