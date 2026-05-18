const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const sitePath = path.join(root, "src", "data", "site.ts");

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

function loadSiteData() {
  const source = fs.readFileSync(sitePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require }, { filename: sitePath });
  return module.exports;
}

async function upsert(url, serviceKey, table, payload, onConflict) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  if (onConflict) endpoint.searchParams.set("on_conflict", onConflict);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${table} upsert failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before uploading site content.");
  }

  const data = loadSiteData();
  const rawBlocks = [
    {
      page_slug: "home",
      block_key: "hero",
      block_type: "hero",
      title_en: "TACT Architecture & Decoration",
      title_ar: "TACT Architecture & Decoration",
      body_en: "Architecture, decoration, and furniture services with full project follow-up.",
      body_ar: "خدمات تصميم وتشطيب وديكور وأثاث مع متابعة كاملة للمشروع.",
      metadata: { contacts: data.SITE },
      sort_order: 0,
    },
    {
      page_slug: "about",
      block_key: "intro",
      block_type: "text",
      title_en: "About Tact",
      title_ar: "نبذة عن Tact",
      body_en: "Company profile content editable from the dashboard.",
      body_ar: "محتوى نبذة الشركة قابل للتعديل من لوحة التحكم.",
      sort_order: 0,
    },
    {
      page_slug: "services",
      block_key: "services-list",
      block_type: "list",
      title_en: "Services",
      title_ar: "الخدمات",
      metadata: { services_en: data.SERVICES_EN || [], services_ar: data.SERVICES_AR || [] },
      sort_order: 0,
    },
    {
      page_slug: "team",
      block_key: "team-directory",
      block_type: "collection",
      title_en: "Meet Our Team",
      title_ar: "فريق العمل",
      metadata: { team: data.TEAM || {} },
      sort_order: 0,
    },
    {
      page_slug: "portfolio",
      block_key: "projects",
      block_type: "collection",
      title_en: "Previous Projects",
      title_ar: "سابقة الأعمال",
      metadata: { designs: data.PROJECTS || [], videos: data.VIDEO_PROJECTS || [] },
      sort_order: 0,
    },
    {
      page_slug: "testimonials",
      block_key: "reviews",
      block_type: "collection",
      title_en: "Client Feedback",
      title_ar: "آراء العملاء",
      metadata: { review_videos: data.REVIEW_VIDEOS || [], testimonials_ar: data.TESTIMONIALS_AR || [] },
      sort_order: 0,
    },
    {
      page_slug: "packages",
      block_key: "package-cards",
      block_type: "collection",
      title_en: "Package Types",
      title_ar: "أنواع الباقات",
      metadata: { packages: data.PACKAGES || [] },
      sort_order: 0,
    },
    {
      page_slug: "payment",
      block_key: "manual-instapay",
      block_type: "payment",
      title_en: "Manual InstaPay Payment",
      title_ar: "الدفع اليدوي عبر InstaPay",
      body_en: "The customer uploads proof after transfer. Admin reviews and unlocks the selected package.",
      body_ar: "العميل يرفع إثبات التحويل بعد الدفع، والأدمن يراجع ويفعل الباقة المختارة.",
      sort_order: 0,
    },
    {
      page_slug: "questionnaire",
      block_key: "initial-questionnaire",
      block_type: "form",
      title_en: "Initial Questionnaire",
      title_ar: "استبيان العميل",
      body_en: "Customer project answers are stored and can be exported as PDF.",
      body_ar: "إجابات العميل يتم حفظها ويمكن تصديرها PDF.",
      sort_order: 0,
    },
    {
      page_slug: "contact",
      block_key: "contact-info",
      block_type: "contact",
      title_en: "Contact",
      title_ar: "بيانات التواصل",
      metadata: { contacts: data.SITE || {} },
      sort_order: 0,
    },
  ];
  const blocks = rawBlocks.map((block) => ({
    page_slug: block.page_slug,
    block_key: block.block_key,
    block_type: block.block_type,
    title_en: block.title_en || null,
    title_ar: block.title_ar || null,
    body_en: block.body_en || null,
    body_ar: block.body_ar || null,
    media_url: block.media_url || null,
    metadata: block.metadata || {},
    sort_order: block.sort_order || 0,
    published: block.published ?? true,
  }));

  await upsert(url, serviceKey, "content_blocks", blocks, "page_slug,block_key");
  await upsert(url, serviceKey, "site_settings", { key: "contact", value: data.SITE || {} }, "key");
  console.log(`Uploaded site content: ${blocks.length} blocks and 1 settings row.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
