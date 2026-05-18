const fs = require("node:fs");
const path = require("node:path");

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
    console.error("Missing credentials");
    process.exit(1);
  }

  const endpoint = new URL("/rest/v1/configurator_selections", url);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("limit", "5");

  const res = await fetch(endpoint, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }
  });

  if (!res.ok) {
    console.error("Fetch failed:", res.status, await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  console.log("=== LATEST 5 SELECTIONS ===");
  rows.forEach((row, i) => {
    console.log(`\nSelection #${i+1} (ID: ${row.id}):`);
    console.log("Package ID:", row.package_id);
    console.log("Created At:", row.created_at);
    console.log("Selections JSON:", JSON.stringify(row.selections, null, 2));
  });
}

main().catch(console.error);
