export type FileManagerClientOptions = {
  baseUrl: string;
  headers?: () => HeadersInit;
};

let clientOptions: FileManagerClientOptions = {
  baseUrl: "/api/platform/file-manager",
};

export function configureFileManagerClient(options: FileManagerClientOptions) {
  clientOptions = { ...options, baseUrl: options.baseUrl.replace(/\/$/u, "") };
}

export async function fileManagerRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${clientOptions.baseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers:
      init?.body instanceof FormData
        ? { ...clientOptions.headers?.(), ...init.headers }
        : {
            "content-type": "application/json",
            ...clientOptions.headers?.(),
            ...init?.headers,
          },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      body.message ?? `File Manager request failed with ${response.status}.`,
    );
  }
  return response.json() as Promise<T>;
}
