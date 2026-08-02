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
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log("==========================================");
  console.log("🔍 Checking Live Supabase Project Quotas...");
  console.log("==========================================\n");

  // 1. Check Storage Buckets
  console.log("📁 1. Fetching Storage Buckets...");
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.error("❌ Failed to list buckets:", bucketErr.message);
  } else {
    console.log(`Found ${buckets.length} bucket(s). Scanning files...\n`);
    
    let totalStorageBytes = 0;
    let totalFiles = 0;
    const typeBreakdown = { images: 0, videos: 0, pdfs: 0, other: 0 };
    const sizeBreakdown = { images: 0, videos: 0, pdfs: 0, other: 0 };

    for (const bucket of buckets) {
      console.log(`Bucket [${bucket.name}] (Public: ${bucket.public}):`);
      try {
        const files = await listAllFiles(supabase, bucket.id, "");
        console.log(`- Files count: ${files.length}`);
        
        let bucketSize = 0;
        files.forEach(f => {
          bucketSize += f.size;
          totalStorageBytes += f.size;
          totalFiles++;

          const type = (f.mimetype || "").toLowerCase();
          const name = f.name.toLowerCase();

          if (type.startsWith("image") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) {
            typeBreakdown.images++;
            sizeBreakdown.images += f.size;
          } else if (type.startsWith("video") || name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) {
            typeBreakdown.videos++;
            sizeBreakdown.videos += f.size;
          } else if (type.includes("pdf") || name.endsWith(".pdf")) {
            typeBreakdown.pdfs++;
            sizeBreakdown.pdfs += f.size;
          } else {
            typeBreakdown.other++;
            sizeBreakdown.other += f.size;
          }
        });
        console.log(`- Total size: ${formatBytes(bucketSize)}\n`);
      } catch (err) {
        console.error(`❌ Error scanning bucket ${bucket.name}:`, err);
      }
    }

    console.log("--- STORAGE SUMMARY ---");
    console.log(`- Total Storage Used: ${formatBytes(totalStorageBytes)} / 1 GB (1,073,741,824 bytes)`);
    console.log(`- Total Files Count: ${totalFiles}`);
    console.log(`- Images Size: ${formatBytes(sizeBreakdown.images)} (${typeBreakdown.images} file(s))`);
    console.log(`- Videos Size: ${formatBytes(sizeBreakdown.videos)} (${typeBreakdown.videos} file(s))`);
    console.log(`- PDFs Size: ${formatBytes(sizeBreakdown.pdfs)} (${typeBreakdown.pdfs} file(s))`);
    console.log(`- Other Size: ${formatBytes(sizeBreakdown.other)} (${typeBreakdown.other} file(s))\n`);
  }

  // 2. Check Database Tables Rows
  console.log("📊 2. Fetching Database Table Row Counts...");
  const tables = [
    "cms_pages", "cms_sections", "cms_section_media", "cms_services", 
    "cms_projects", "cms_project_media", "cms_team_members", "cms_clients", 
    "cms_client_testimonials", "cms_contact_settings", "client_projects", 
    "project_stages", "project_stage_files", "project_stage_notes", "project_files", 
    "upload_operations", "profiles", "user_roles", "payment_submissions", 
    "configurator_selections", "questionnaires", "packages", "package_styles", 
    "package_categories", "package_options", "package_option_media", "package_unlocks", 
    "payment_methods", "site_pages", "content_blocks", "site_settings",
    // Legacy/backup tables to check if they have rows
    "pre_backfill_project_stages_backup", "pre_backfill_stage_files_backup", 
    "projects", "project_media", "team_members", "testimonials"
  ];

  let totalRows = 0;
  console.log("\nTable Row Counts:");
  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select("id", { count: "exact", head: true });
      if (error) {
        // Skip missing table errors quietly
        continue;
      }
      console.log(`- ${t.padEnd(35)} : ${count || 0} row(s)`);
      totalRows += (count || 0);
    } catch {
      // Ignore
    }
  }
  console.log(`\n- Total Database Rows across scanned tables: ${totalRows.toLocaleString()}`);
  console.log("==========================================");
}

async function listAllFiles(supabase, bucketId, folder) {
  let allFiles = [];
  let limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketId).list(folder || undefined, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" }
    });

    if (error) {
      console.error(`Error listing folder [${folder}] in bucket [${bucketId}]:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.metadata) {
        // It's a file
        allFiles.push({
          name: fullPath,
          size: item.metadata.size || 0,
          mimetype: item.metadata.mimetype
        });
      } else {
        // It's a folder, recurse
        const subFiles = await listAllFiles(supabase, bucketId, fullPath);
        allFiles = allFiles.concat(subFiles);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

main().catch(console.error);
