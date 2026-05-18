const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "real-content-manifest.json");
const envPath = path.join(root, ".env");

function readEnv() {
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (!line.includes("=") || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      env[line.slice(0, idx)] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return { ...env, ...process.env };
}

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before uploading metadata.");
  }
  if (!fs.existsSync(manifestPath)) {
    throw new Error("real-content-manifest.json not found. Run npm run scan:real-content first.");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const rows = manifest.files.map((file) => ({
    bucket: file.bucket,
    path: file.path,
    public_url: file.public_url,
    media_type: file.media_type,
    title: file.title,
    alt: file.alt,
    size_bytes: file.size_bytes,
    source_folder: file.source_folder,
    tags: file.tags,
  }));

  const chunkSize = 200;
  let uploaded = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${url}/rest/v1/media_assets?on_conflict=path`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed at row ${i}: ${res.status} ${text}`);
    }
    uploaded += chunk.length;
    console.log(`Uploaded metadata ${uploaded}/${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
