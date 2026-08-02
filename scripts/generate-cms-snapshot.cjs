const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const outputPath = path.join(root, "src", "data", "cms-snapshot.json");

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
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
  }

  console.log("Connecting to Supabase at:", url);
  const supabase = createClient(url, key);

  console.log("Fetching tables...");
  const [
    sectionsRes,
    sectionMediaRes,
    servicesRes,
    projectsRes,
    projectMediaRes,
    teamRes,
    testimonialsRes,
    contactRes
  ] = await Promise.all([
    supabase.from("cms_sections").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_section_media").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_services").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_projects").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_project_media").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_team_members").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_client_testimonials").select("*").eq("visible", true).order("sort_order"),
    supabase.from("cms_contact_settings").select("*").maybeSingle()
  ]);

  if (sectionsRes.error) console.error("Error sections:", sectionsRes.error);
  if (sectionMediaRes.error) console.error("Error sectionMedia:", sectionMediaRes.error);
  if (servicesRes.error) console.error("Error services:", servicesRes.error);
  if (projectsRes.error) console.error("Error projects:", projectsRes.error);
  if (projectMediaRes.error) console.error("Error projectMedia:", projectMediaRes.error);
  if (teamRes.error) console.error("Error team:", teamRes.error);
  if (testimonialsRes.error) console.error("Error testimonials:", testimonialsRes.error);
  if (contactRes.error) console.error("Error contact:", contactRes.error);

  const snapshot = {
    exported_at: new Date().toISOString(),
    cms_sections: sectionsRes.data || [],
    cms_section_media: sectionMediaRes.data || [],
    cms_services: servicesRes.data || [],
    cms_projects: projectsRes.data || [],
    cms_project_media: projectMediaRes.data || [],
    cms_team_members: teamRes.data || [],
    cms_client_testimonials: testimonialsRes.data || [],
    cms_contact_settings: contactRes.data || null
  };

  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf8");
  console.log("CMS Snapshot generated successfully at:", outputPath);
}

main().catch(err => {
  console.error("Snapshot generation failed:", err);
  process.exit(1);
});
