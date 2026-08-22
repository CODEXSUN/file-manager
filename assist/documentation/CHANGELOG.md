# Changelog

## Version State

Current version: 1.1.1

Release tag: v-1.1.1

Changelog label: v 1.1.1

## v-1.1.1

### [v 1.1.1] 2026-08-22 - Host integration compatibility

#### Database Changes

- Database update: No.
- Fixed migration ledger detection for shared host databases.
- Kept one-time adoption support for the legacy File Manager ledger.

#### App Codebase Changes

- Moved public contracts into the installable root package.
- Removed the private contract workspace dependency from API imports.
- Added all runtime dependencies to the root package for Git consumers.
- Kept public API, web, and contract import paths stable.

## v-1.1.0

### [v 1.1.0] 2026-08-22 - Central storage package

#### Database Changes

- Database update: Yes.
- Added the standard migration ledger with versions, batches, checksums, states, and a migration lock.
- Added safe adoption of the legacy File Manager migration ledger.
- Removed automatic database creation from package startup.

#### App Codebase Changes

- Added a host-adapter contract for any application with a trusted server scope.
- Added automatic Local storage below the configured application and scope path.
- Added provider discovery and dynamic connection fields in the web workspace.
- Added a public adapter contract for custom storage providers.
- Added Google Drive OAuth refresh-token support.
- Added content and download URLs for managed files.
- Added file download controls to the file browser.
- Fixed deletion behavior for managed provider objects and external links.
- Split provider code into Local, S3-compatible, and Google Drive modules.
- Added contract and Local storage smoke tests.
- Updated the integration guide for CXApp, CXShop, and other host applications.

## v-1.0.0

### [v 1.0.0] 2026-08-20 - File Manager foundation

#### Database Changes

- Database update: Yes.
- Added owner tables for storage connections, folders, and files.

#### App Codebase Changes

- Created the standalone `@codexsun/file-manager` plugin.
- Added Local, external URL, Amazon S3, Cloudflare R2, and Google Drive providers.
- Added host-neutral API, web, and contract exports for CXApp, TechMedia, and CXShop.
