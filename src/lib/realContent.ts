const configuredBase = import.meta.env.VITE_REAL_CONTENT_BASE_URL as string | undefined;

export const REAL_CONTENT_BASE_URL = (configuredBase || "/real-content").replace(/\/+$/, "");

function encodePath(path: string) {
  return path
    .split("/")
    .map((segment) => {
      if (/^[A-Za-z0-9._-]+$/.test(segment)) return segment;
      const bytes = new TextEncoder().encode(segment);
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return `u_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
    })
    .join("/");
}

export function realContentUrl(path: string) {
  const cleanPath = path.replace(/^\/?real-content\/?/, "").replace(/^\/+/, "");
  return `${REAL_CONTENT_BASE_URL}/${encodePath(cleanPath)}`;
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return url ?? null;
  if (!url.startsWith("/real-content/")) return url;
  return realContentUrl(url);
}
