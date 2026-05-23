import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('d:\\شركة التشطيبات\\tact-architects-experience\\.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Checking cms_projects table schema for tour360_url field...");
  const projectsRes = await fetch(`${url}/rest/v1/cms_projects?select=id,tour360_url&limit=1`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  
  if (!projectsRes.ok) {
    const text = await projectsRes.text();
    console.error("Error fetching projects:", text);
    process.exit(1);
  }
  
  const data = await projectsRes.json();
  console.log("Successfully connected and queried cms_projects table!");
  console.log("Sample project record:", JSON.stringify(data[0] || {}, null, 2));
}

run().catch(console.error);
