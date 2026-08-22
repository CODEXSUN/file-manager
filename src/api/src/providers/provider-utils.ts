export function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

export function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function requiredUrl(value: unknown, label: string) {
  const url = optionalUrl(value);
  if (!url) throw new Error(`${label} is required.`);
  return url;
}

export function optionalUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Storage URLs must use HTTP or HTTPS.");
  }
  return url.toString().replace(/\/$/u, "");
}

export function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}
