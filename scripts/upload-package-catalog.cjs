const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const configPath = path.join(root, "src", "data", "packageConfigMap.ts");

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

function loadPackageConfigMap() {
  const source = fs.readFileSync(configPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require,
  };
  vm.runInNewContext(output, context, { filename: configPath });
  return module.exports.PACKAGE_CONFIG_MAP;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function wipeTable(url, serviceKey, table) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  endpoint.searchParams.set("id", "not.is.null");
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`Wipe of ${table} failed: ${res.status} ${text}`);
  } else {
    console.log(`Wiped old legacy records from ${table}`);
  }
}

async function request(url, serviceKey, table, payload, onConflict) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  if (onConflict) endpoint.searchParams.set("on_conflict", onConflict);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} upsert failed: ${res.status} ${text}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before uploading package catalog.");
  }

  const catalog = loadPackageConfigMap();
  
  console.log("Starting a clean catalog synchronization...");
  await wipeTable(url, serviceKey, "package_option_media");
  await wipeTable(url, serviceKey, "package_options");
  await wipeTable(url, serviceKey, "package_categories");
  await wipeTable(url, serviceKey, "package_styles");
  console.log("Database purged. Seeding fresh catalog...");
  let styleCount = 0;
  let categoryCount = 0;
  let optionCount = 0;
  let mediaCount = 0;

  for (const [packageId, styles] of Object.entries(catalog)) {
    for (const [styleIndex, style] of styles.entries()) {
      const styleRow = await request(
        url,
        serviceKey,
        "package_styles",
        {
          package_id: packageId,
          name_en: style.styleNameEn,
          name_ar: style.styleNameAr,
          sort_order: styleIndex,
          published: true,
        },
        "package_id,name_en",
      );
      styleCount += 1;

      for (const [categoryIndex, section] of style.sections.entries()) {
        const categoryRow = await request(
          url,
          serviceKey,
          "package_categories",
          {
            style_id: styleRow.id,
            slug: section.id || slugify(section.nameEn),
            name_en: section.nameEn,
            name_ar: section.nameAr,
            sort_order: categoryIndex,
            published: true,
          },
          "style_id,slug",
        );
        categoryCount += 1;

        for (const [optionIndex, option] of section.options.entries()) {
          const optionRow = await request(
            url,
            serviceKey,
            "package_options",
            {
              category_id: categoryRow.id,
              name_en: option.nameEn,
              name_ar: option.nameAr,
              description_en: option.descEn,
              description_ar: option.descAr,
              image_url: option.img,
              sort_order: optionIndex,
              published: true,
            },
            "category_id,name_en",
          );
          optionCount += 1;

          if (option.img) {
            await request(
              url,
              serviceKey,
              "package_option_media",
              {
                option_id: optionRow.id,
                media_type: "image",
                url: option.img,
                alt_en: option.nameEn,
                alt_ar: option.nameAr,
                sort_order: 0,
              },
              "option_id,url",
            );
            mediaCount += 1;
          }
        }
      }
    }
  }

  console.log(`Uploaded package catalog: ${styleCount} styles, ${categoryCount} categories, ${optionCount} options, ${mediaCount} media links.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
