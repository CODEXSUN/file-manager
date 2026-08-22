import { optionalText, requiredText } from "./provider-utils.js";
import type { ProviderConnection, StoredObject } from "./provider.types.js";

export async function testGoogleDriveProvider(connection: ProviderConnection) {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/about?fields=user",
    { headers: await authorizationHeaders(connection) },
  );
  if (!response.ok) {
    throw new Error(`Google Drive connection failed with ${response.status}.`);
  }
}

export async function putGoogleDriveObject(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  const boundary = `file-manager-${Date.now()}`;
  const metadata = JSON.stringify({
    name: key.split("/").at(-1),
    parents: connection.config.rootFolderId
      ? [connection.config.rootFolderId]
      : undefined,
  });
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
    body,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink",
    {
      body: payload,
      headers: {
        ...(await authorizationHeaders(connection)),
        "content-type": `multipart/related; boundary=${boundary}`,
      },
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`Google Drive upload failed with ${response.status}.`);
  }
  const result = (await response.json()) as {
    id: string;
    webContentLink?: string;
  };
  return { providerKey: result.id, publicUrl: result.webContentLink ?? null };
}

export async function getGoogleDriveObject(
  connection: ProviderConnection,
  key: string,
) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}?alt=media`,
    { headers: await authorizationHeaders(connection) },
  );
  if (!response.ok) {
    throw new Error(`Google Drive download failed with ${response.status}.`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteGoogleDriveObject(
  connection: ProviderConnection,
  key: string,
) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}`,
    { headers: await authorizationHeaders(connection), method: "DELETE" },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Google Drive delete failed with ${response.status}.`);
  }
}

async function authorizationHeaders(connection: ProviderConnection) {
  return { authorization: `Bearer ${await googleAccessToken(connection)}` };
}

async function googleAccessToken(connection: ProviderConnection) {
  const accessToken = optionalText(connection.credentials.accessToken);
  if (accessToken) return accessToken;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: requiredText(
        connection.credentials.clientId,
        "OAuth client ID",
      ),
      client_secret: requiredText(
        connection.credentials.clientSecret,
        "OAuth client secret",
      ),
      grant_type: "refresh_token",
      refresh_token: requiredText(
        connection.credentials.refreshToken,
        "OAuth refresh token",
      ),
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Google OAuth refresh failed with ${response.status}.`);
  }
  const payload = (await response.json()) as { access_token?: unknown };
  return requiredText(payload.access_token, "Google OAuth access token");
}
