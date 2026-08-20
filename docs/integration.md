# File Manager integration

Install `@codexsun/file-manager` at an exact release tag. Register its API once
in the host Fastify application. Mount its web workspaces in the host app desk.

The host must provide a trusted `FileManagerRequestContext`. Resolve the tenant
and actor from the verified server session. Do not accept a tenant identifier
from request input.

File Manager owns its `fm_*` tables, provider records, and local storage root.
The host may provide a dedicated database or an approved shared database.
Configure every `FILE_MANAGER_*` setting before the API starts. The API fails
when a setting is missing, invalid, or cannot connect.

Provider secrets are encrypted before MariaDB writes. API responses never
return a secret. Host applications use file UUIDs and public routes only.

Run File Manager migrations before routes become available. Back up the File
Manager database and local storage before an upgrade.
