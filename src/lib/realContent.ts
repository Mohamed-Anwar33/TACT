const DEFAULT_REAL_CONTENT_BASE_URL =
  "https://lnzxissivnzpjvvxulvc.supabase.co/storage/v1/object/public/real-content";

const configuredBase = import.meta.env.VITE_REAL_CONTENT_BASE_URL as string | undefined;

export const REAL_CONTENT_BASE_URL = (configuredBase || DEFAULT_REAL_CONTENT_BASE_URL).replace(/\/+$/, "");

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
  const cleanPath = decodeURIComponent(path.replace(/^\/?real-content\/?/, "").replace(/^\/+/, ""));
  return `${REAL_CONTENT_BASE_URL}/${encodePath(cleanPath)}`;
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return url ?? null;

  if (url.startsWith("/real-content/")) {
    return realContentUrl(url);
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/real-content/")) {
      return realContentUrl(parsed.pathname);
    }

    const realContentMarker = "/storage/v1/object/public/real-content/";
    const markerIndex = parsed.pathname.indexOf(realContentMarker);
    if (markerIndex >= 0) {
      const realContentPath = parsed.pathname.slice(markerIndex + realContentMarker.length);
      return realContentUrl(realContentPath);
    }
  } catch {
    return url;
  }

  return url;
}
