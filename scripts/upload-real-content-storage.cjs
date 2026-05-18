const fs = require("node:fs");
const path = require("node:path");
const tus = require("tus-js-client");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const sourceDir = path.join(root, "public", "real-content");
const bucket = process.env.REAL_CONTENT_BUCKET || "real-content";
const standardUploadLimit = 6 * 1024 * 1024;

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

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".jfif": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
  }[ext] || "application/octet-stream";
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!entry.isFile()) return [];
    return [fullPath];
  });
}

function toStoragePath(filePath) {
  return encodeStoragePath(toRealContentPath(filePath));
}

function toRealContentPath(filePath) {
  return path.relative(sourceDir, filePath).replace(/\\/g, "/");
}

function encodeStoragePath(realContentPath) {
  return realContentPath
    .split("/")
    .map((segment) => {
      if (/^[A-Za-z0-9._-]+$/.test(segment)) return segment;
      return `u_${Buffer.from(segment, "utf8").toString("base64url")}`;
    })
    .join("/");
}

function toPublicUrl(baseUrl, storagePath) {
  return `${baseUrl}/${storagePath}`;
}

function writeEnvValue(key, value) {
  const quoted = `${key}="${value}"`;
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (idx >= 0) lines[idx] = quoted;
  else lines.push(quoted);
  fs.writeFileSync(envPath, lines.join("\n").replace(/\n{3,}/g, "\n\n"), "utf8");
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const existing = buckets?.find((item) => item.name === bucket);
  if (existing) {
    console.log(`Bucket ${bucket} exists: public=${existing.public}, file_size_limit=${existing.file_size_limit ?? "default"}`);
  }
  if (!existing) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "50MB",
    });
    if (error) throw error;
    return;
  }

  {
    const { error } = await supabase.storage.updateBucket(bucket, {
      public: true,
      fileSizeLimit: "50MB",
    });
    if (error) throw error;
  }
}

async function uploadFiles(supabase, files, publicBaseUrl) {
  let uploaded = 0;
  let skipped = 0;
  const mappings = new Map();

  for (const filePath of files) {
    const realContentPath = toRealContentPath(filePath);
    const storagePath = toStoragePath(filePath);
    const publicUrl = toPublicUrl(publicBaseUrl, storagePath);
    mappings.set(`/real-content/${realContentPath}`, publicUrl);

    const size = fs.statSync(filePath).size;
    console.log(`Uploading ${uploaded + 1}/${files.length}: ${storagePath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    if (size > standardUploadLimit) {
      await uploadLargeFile(filePath, storagePath, publicBaseUrl);
    } else {
      await uploadStandardFile(supabase, filePath, storagePath);
    }
    uploaded += 1;
    if (uploaded % 50 === 0 || uploaded === files.length) {
      console.log(`Uploaded ${uploaded}/${files.length}`);
    }
  }

  return { mappings, uploaded, skipped };
}

async function uploadStandardFile(supabase, filePath, storagePath) {
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const body = fs.readFileSync(filePath);
    const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
      cacheControl: "31536000",
      contentType: contentType(filePath),
      duplex: "half",
      upsert: true,
    });

    if (!error) return;
    lastError = error;
    const retryable = /timeout|gateway|network|fetch|5\d\d/i.test(error.message || "");
    if (!retryable || attempt === 4) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
  }
  throw new Error(`Upload failed for ${storagePath}: ${lastError?.message || lastError}`);
}

function projectIdFromUrl(supabaseUrl) {
  return new URL(supabaseUrl).hostname.split(".")[0];
}

function uploadLargeFile(filePath, storagePath, supabaseUrl) {
  const env = readEnv();
  const projectId = env.VITE_SUPABASE_PROJECT_ID || projectIdFromUrl(env.SUPABASE_URL || env.VITE_SUPABASE_URL);
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const endpoint = `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
  const file = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: standardUploadLimit,
      metadata: {
        bucketName: bucket,
        objectName: storagePath,
        contentType: contentType(filePath),
        cacheControl: "31536000",
      },
      onError(error) {
        reject(new Error(`Resumable upload failed for ${storagePath}: ${error.message || error}`));
      },
      onSuccess() {
        resolve();
      },
    });

    upload.start();
  });
}

function convertValue(value, mappings, publicBaseUrl) {
  if (typeof value !== "string" || !value.startsWith("/real-content/")) return value;
  const mapped = mappings.get(value);
  if (mapped) return mapped;
  return `${publicBaseUrl}/${encodeStoragePath(value.slice("/real-content/".length))}`;
}

async function updateTableUrls(supabase, table, idColumn, columns, mappings, publicBaseUrl) {
  const selectColumns = [idColumn, ...columns].join(",");
  const { data, error } = await supabase.from(table).select(selectColumns);
  if (error) {
    console.warn(`Skipped ${table}: ${error.message}`);
    return 0;
  }

  let changed = 0;
  for (const row of data || []) {
    const patch = {};
    for (const column of columns) {
      const next = convertValue(row[column], mappings, publicBaseUrl);
      if (next !== row[column]) patch[column] = next;
    }
    if (!Object.keys(patch).length) continue;

    const { error: updateError } = await supabase.from(table).update(patch).eq(idColumn, row[idColumn]);
    if (updateError) throw new Error(`Failed updating ${table}.${idColumn}=${row[idColumn]}: ${updateError.message}`);
    changed += 1;
  }
  if (changed) console.log(`Updated ${changed} rows in ${table}`);
  return changed;
}

async function updateDatabaseUrls(supabase, mappings, publicBaseUrl) {
  const tables = [
    ["media_assets", "id", ["public_url"]],
    ["cms_section_media", "id", ["url"]],
    ["cms_projects", "id", ["cover_url", "video_url", "pdf_url"]],
    ["cms_project_media", "id", ["url"]],
    ["cms_client_testimonials", "id", ["image_url", "video_url", "video_cover_url"]],
    ["package_options", "id", ["image_url"]],
    ["package_option_media", "id", ["url"]],
    ["content_blocks", "id", ["media_url"]],
  ];

  let total = 0;
  for (const [table, idColumn, columns] of tables) {
    total += await updateTableUrls(supabase, table, idColumn, columns, mappings, publicBaseUrl);
  }
  return total;
}

async function main() {
  const env = readEnv();
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Set VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before uploading real content.");
  }
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing source folder: ${sourceDir}`);
  }

  const publicBaseUrl = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}`;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await ensureBucket(supabase);
  const files = walk(sourceDir);
  const { mappings, uploaded } = await uploadFiles(supabase, files, publicBaseUrl);
  const dbRowsUpdated = await updateDatabaseUrls(supabase, mappings, publicBaseUrl);
  writeEnvValue("VITE_REAL_CONTENT_BASE_URL", publicBaseUrl);

  console.log(JSON.stringify({ bucket, publicBaseUrl, uploaded, dbRowsUpdated }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
