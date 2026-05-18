import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

function realContentCdnPlugin(realContentBaseUrl?: string) {
  const base = realContentBaseUrl?.replace(/\/+$/, "");
  const safeSegment = (segment: string) => {
    if (/^[A-Za-z0-9._-]+$/.test(segment)) return segment;
    return `u_${Buffer.from(segment, "utf8").toString("base64url")}`;
  };
  const encodePath = (value: string) =>
    value
      .split("/")
      .map((segment) => safeSegment(segment))
      .join("/");
  return {
    name: "real-content-cdn-url",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!base || !/\.(tsx?|jsx?)$/.test(id)) return null;
      if (!code.includes("/real-content/")) return null;
      return code
        .replace(/(["'`])\/real-content\/([^"'`]+)\1/g, (_match, quote, realPath) => {
          return `${quote}${base}/${encodePath(realPath)}${quote}`;
        })
        .replace(/\/real-content\//g, `${base}/`);
    },
  };
}

function omitLocalRealContentFromDistPlugin() {
  return {
    name: "omit-local-real-content-from-dist",
    closeBundle() {
      const realContentDist = path.resolve(__dirname, "dist", "real-content");
      if (fs.existsSync(realContentDist)) {
        fs.rmSync(realContentDist, { recursive: true, force: true });
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [realContentCdnPlugin(env.VITE_REAL_CONTENT_BASE_URL), react(), omitLocalRealContentFromDistPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
