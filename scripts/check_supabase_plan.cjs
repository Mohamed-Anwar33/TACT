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

  console.log("==========================================");
  console.log("🔎 Inspecting Supabase Project Parameters...");
  console.log("Project Reference ID: lnzxissivnzpjvvxulvc");
  console.log("==========================================\n");

  const supabase = createClient(url, serviceKey);

  // Check 1: Storage buckets list
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    console.log(`- Storage Buckets count: ${buckets ? buckets.length : 0}`);
    if (buckets) {
      buckets.forEach(b => console.log(`  * Bucket: ${b.name} (Public: ${b.public}, File size limit: ${b.file_size_limit || 'Default'})`));
    }
  } catch (e) {
    console.log("- Storage check error:", e.message);
  }

  // Check 2: Test auth / settings
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });
    console.log(`- REST API Status: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log("- REST API fetch error:", e.message);
  }

  // Check 3: Check database connection parameters via RPC or direct query
  try {
    const { data: settingsData, error: setErr } = await supabase.rpc("get_system_statistics");
    if (!setErr) {
      console.log("- get_system_statistics RPC is working!");
      console.log("  RPC output:", JSON.stringify(settingsData).slice(0, 300) + "...");
    } else {
      console.log("- RPC get_system_statistics error/status:", setErr.message);
    }
  } catch (e) {
    console.log("- RPC error:", e.message);
  }

  // Check 4: Check Management API if access token is present
  const mgmtToken = env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_MGMT_TOKEN;
  if (mgmtToken) {
    try {
      const projRes = await fetch("https://api.supabase.com/v1/projects/lnzxissivnzpjvvxulvc", {
        headers: { Authorization: `Bearer ${mgmtToken}` }
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        console.log("\n⚡ SUPABASE MANAGEMENT API PROJECT DETAILS:");
        console.log(`- Name: ${projData.name}`);
        console.log(`- Plan / Tier: ${projData.plan || projData.subscription_id || 'Pro / Custom'}`);
        console.log(`- Status: ${projData.status}`);
        console.log(`- Region: ${projData.region}`);
      } else {
        console.log(`\n- Management API status: ${projRes.status} (${projRes.statusText})`);
      }
    } catch (e) {
      console.log("- Management API error:", e.message);
    }
  } else {
    console.log("\nNote: SUPABASE_ACCESS_TOKEN is not defined in .env for Management API direct query.");
  }

  console.log("\n==========================================");
}

main().catch(console.error);
