const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "..");
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
  const url = env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log("\n==========================================");
  console.log("🔍 Live Supabase Database & Storage Inspection");
  console.log("==========================================\n");

  // 1. Storage files check via media_assets & storage buckets
  const { data: mediaAssets, error: mediaErr } = await supabase
    .from("media_assets")
    .select("size_bytes, media_type, path");

  let totalStorageBytes = 0;
  let fileCount = 0;
  let imagesSize = 0, imagesCount = 0;
  let videosSize = 0, videosCount = 0;
  let pdfsSize = 0, pdfsCount = 0;
  let otherSize = 0, otherCount = 0;

  if (!mediaErr && mediaAssets) {
    fileCount = mediaAssets.length;
    mediaAssets.forEach((file) => {
      const size = Number(file.size_bytes || 0);
      const type = (file.media_type || "").toLowerCase();
      const p = (file.path || "").toLowerCase();

      totalStorageBytes += size;
      if (type.startsWith("image") || p.endsWith(".png") || p.endsWith(".jpg") || p.endsWith(".jpeg") || p.endsWith(".webp")) {
        imagesSize += size;
        imagesCount++;
      } else if (type.startsWith("video") || p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".mov")) {
        videosSize += size;
        videosCount++;
      } else if (type.includes("pdf") || p.endsWith(".pdf")) {
        pdfsSize += size;
        pdfsCount++;
      } else {
        otherSize += size;
        otherCount++;
      }
    });
  }

  console.log("📁 1. Storage Metadata (Media Assets):");
  console.log(`   - Total Files: ${fileCount.toLocaleString()}`);
  console.log(`   - Total Storage Size: ${(totalStorageBytes / (1024 * 1024)).toFixed(2)} MB / 1 GB (${((totalStorageBytes / 1073741824) * 100).toFixed(1)}%)`);
  console.log(`   - Images: ${imagesCount} files, ${(imagesSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   - Videos: ${videosCount} files, ${(videosSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   - PDFs: ${pdfsCount} files, ${(pdfsSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   - Other: ${otherCount} files, ${(otherSize / (1024 * 1024)).toFixed(2)} MB\n`);

  // 2. Database Tables Rows
  console.log("📊 2. Database Tables Row Counts & Estimates:");
  const tables = [
    "cms_pages", "cms_sections", "cms_section_media", "cms_services", 
    "cms_projects", "cms_project_media", "cms_team_members", "cms_clients", 
    "cms_client_testimonials", "cms_contact_settings", "client_projects", 
    "project_stages", "project_stage_files", "project_stage_notes", "project_files", 
    "upload_operations", "profiles", "user_roles", "payment_submissions", 
    "configurator_selections", "questionnaires", "packages", "package_styles", 
    "package_categories", "package_options", "package_option_media", "package_unlocks", 
    "payment_methods", "site_pages", "content_blocks", "site_settings"
  ];

  let totalRows = 0;
  let estimatedDbBytes = 4 * 1024 * 1024; // 4MB system base

  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select("id", { count: "exact", head: true });
      if (!error && count !== null) {
        const rowCount = count || 0;
        const estSize = Math.max(16384, rowCount * 280);
        estimatedDbBytes += estSize;
        totalRows += rowCount;
        if (rowCount > 0) {
          console.log(`   - ${t.padEnd(30)} : ${rowCount.toLocaleString()} row(s) (~${(estSize / 1024).toFixed(1)} KB)`);
        }
      }
    } catch (err) {}
  }

  console.log(`\n   - Total Scanned Active Rows: ${totalRows.toLocaleString()} row(s)`);
  console.log(`   - Total DB Estimated Size  : ${(estimatedDbBytes / (1024 * 1024)).toFixed(2)} MB / 500 MB (${((estimatedDbBytes / 524288000) * 100).toFixed(1)}%)`);
  console.log("==========================================\n");
}

main().catch(console.error);
