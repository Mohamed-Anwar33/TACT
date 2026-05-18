const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const contentRoot = path.join(publicRoot, "real-content");
const outputPath = path.join(root, "real-content-manifest.json");

const mediaTypeByExt = {
  ".webp": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".jfif": "image",
  ".mp4": "video",
  ".mov": "video",
  ".pdf": "pdf",
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!entry.isFile()) return [];
    return [full];
  });
}

const files = walk(contentRoot)
  .map((fullPath) => {
    const ext = path.extname(fullPath).toLowerCase();
    const mediaType = mediaTypeByExt[ext];
    if (!mediaType) return null;
    const stat = fs.statSync(fullPath);
    const relativePublicPath = "/" + path.relative(publicRoot, fullPath).replaceAll(path.sep, "/");
    const sourceFolder = path.relative(contentRoot, path.dirname(fullPath)).replaceAll(path.sep, "/");
    return {
      bucket: "public",
      path: relativePublicPath,
      public_url: relativePublicPath,
      media_type: mediaType,
      title: path.basename(fullPath, ext),
      alt: path.basename(fullPath, ext),
      size_bytes: stat.size,
      source_folder: sourceFolder,
      tags: sourceFolder.split("/").filter(Boolean),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.path.localeCompare(b.path));

const summary = files.reduce((acc, item) => {
  acc.total += 1;
  acc.bytes += item.size_bytes;
  acc.by_type[item.media_type] = (acc.by_type[item.media_type] || 0) + 1;
  return acc;
}, { total: 0, bytes: 0, by_type: {} });

fs.writeFileSync(outputPath, JSON.stringify({ generated_at: new Date().toISOString(), summary, files }, null, 2));

console.log(`Wrote ${files.length} media metadata records to ${outputPath}`);
console.log(`Total size: ${(summary.bytes / 1024 / 1024).toFixed(2)} MB`);
