const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const sitePath = path.join(root, "src", "data", "site.ts");
const backupDir = path.join(root, "cms-backups");

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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require }, { filename: sitePath });
  return module.exports;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

async function upsert(url, key, table, rows, conflict) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  if (conflict) endpoint.searchParams.set("on_conflict", conflict);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL/service role key.");

  const site = loadSiteData();
  fs.mkdirSync(backupDir, { recursive: true });
  const snapshot = {
    exported_at: new Date().toISOString(),
    source_files: [
      "src/data/site.ts",
      "src/pages/Home.tsx",
      "src/components/home/teqaan/*",
      "src/components/home/TeamPreview.tsx",
      "public/real-content",
      "src/assets",
    ],
    site,
  };
  const backupPath = path.join(backupDir, `public-cms-snapshot-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), "utf8");

  const pages = [
    ["home", "Home", "الرئيسية"],
    ["about", "About", "من نحن"],
    ["services", "Services", "خدماتنا"],
    ["portfolio", "Portfolio", "أعمالنا"],
    ["team", "Team", "فريق العمل"],
    ["testimonials", "Clients", "العملاء"],
    ["contact", "Contact", "تواصل معنا"],
  ].map(([slug, title_en, title_ar], index) => ({
    slug,
    title_en,
    title_ar,
    nav_label_en: title_en,
    nav_label_ar: title_ar,
    sort_order: index + 1,
    visible: true,
  }));

  const sections = [
    ["home", "hero", "Hero Section", "قسم البداية", "Tact Architecture & Decoration", "تاكت للعمارة والديكور", "Integrated design, finishing, and decoration experience.", "تجربة متكاملة في التصميم والتشطيب والديكور.", "/questionnaire", "Start Project", "ابدأ مشروعك", 1],
    ["home", "about-preview", "About Preview", "نبذة مختصرة", "Engineering meaning inside every space", "هندسة المعنى داخل كل مساحة", null, null, "/about", "Learn More", "اعرف عنا أكثر", 2],
    ["home", "services-preview", "Services Preview", "مختصر الخدمات", "Our Services", "خدماتنا", null, null, "/services", "View All", "عرض الكل", 3],
    ["home", "works-preview", "Works Preview", "مختصر الأعمال", "Our Actual Works & Designs", "أعمالنا وتصميماتنا الفعلية", null, null, "/portfolio", "View Work", "عرض الأعمال", 4],
    ["home", "pdf-booklets", "PDF Booklets", "الكتيبات الفنية", "Technical Booklets & Presentations", "الكتيبات الفنية والعروض التقديمية", null, null, "/presentations", "Open Presentations", "فتح العروض", 5],
    ["home", "team-preview", "Team Preview", "مختصر الفريق", "Minds Behind Details", "العقول خلف التفاصيل", null, null, "/team", "View All", "عرض الكل", 6],
    ["home", "testimonials", "Testimonials", "آراء العملاء", "Trust Built With Every Handover", "ثقة تُبنى مع كل تسليم", null, null, "/testimonials", "Clients", "العملاء", 7],
    ["home", "packages-cta", "Packages CTA", "دعوة الباقات", "Select Your Finishing Tier", "اختر الباقة الأنسب لمساحتك", null, null, "/packages", "Packages", "الباقات", 8],
    ["about", "hero", "Hero Section", "قسم البداية", "About Tact", "من نحن", null, null, null, null, null, 1],
    ["about", "process", "Process", "رحلتنا", "From idea to keys", "من الفكرة إلى المفتاح", null, null, null, null, null, 2],
    ["about", "values", "Values", "القيم", "What makes us Tact", "ما الذي يجعلنا تاكت", null, null, null, null, null, 3],
    ["services", "services-list", "Services List", "قائمة الخدمات", "Services", "خدماتنا", null, null, null, null, null, 1],
    ["portfolio", "projects-list", "Projects List", "قائمة الأعمال", "Portfolio", "أعمالنا", null, null, null, null, null, 1],
    ["team", "team-list", "Team List", "قائمة الفريق", "Meet Our Team", "فريق العمل", null, null, null, null, null, 1],
    ["testimonials", "clients-list", "Clients List", "قائمة العملاء", "Client Wall of Honor", "العملاء", null, null, null, null, null, 1],
    ["contact", "contact-info", "Contact Info", "بيانات التواصل", "Contact", "تواصل معنا", null, null, null, null, null, 1],
  ].map(([page_slug, section_key, section_name_en, section_name_ar, title_en, title_ar, body_en, body_ar, cta_url, cta_label_en, cta_label_ar, sort_order]) => ({
    page_slug, section_key, section_name_en, section_name_ar, title_en, title_ar, body_en, body_ar, cta_url, cta_label_en, cta_label_ar, sort_order, visible: true,
  }));

  await upsert(url, key, "cms_pages", pages, "slug");
  const sectionRows = await upsert(url, key, "cms_sections", sections, "page_slug,section_key");
  const sectionMap = new Map(sectionRows.map((row) => [`${row.page_slug}:${row.section_key}`, row.id]));
  const sectionMedia = [
    ["home:hero", "video", "video", "/real-content/Finishing videos/Luxury modern.mp4"],
    ["home:hero", "poster", "image", "/real-content/Finishing videos/Luxury modern-thumb.webp"],
    ["home:about-preview", "gallery", "image", "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp"],
    ["home:about-preview", "gallery", "image", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp"],
    ["home:works-preview", "cover", "image", "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp"],
    ["home:testimonials", "video", "video", "/real-content/Customers Reviews/Customers Reviews.mp4"],
    ["contact:contact-info", "cover", "image", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191737_.webp"],
  ]
    .filter(([keyName]) => sectionMap.has(keyName))
    .map(([keyName, role, media_type, mediaUrl], index) => ({
      section_id: sectionMap.get(keyName),
      role,
      media_type,
      url: mediaUrl,
      sort_order: index,
      visible: true,
    }));

  if (sectionMedia.length) await upsert(url, key, "cms_section_media", sectionMedia, "section_id,role,url");

  const services = (site.SERVICES_EN || []).map((service, index) => {
    const ar = (site.SERVICES_AR || [])[index] || {};
    return {
      slug: slugify(service.title),
      number_label: service.num || ar.num || String(index + 1).padStart(2, "0"),
      title_en: service.title || ar.title || `Service ${index + 1}`,
      title_ar: ar.title || service.title || `خدمة ${index + 1}`,
      short_en: service.desc || ar.desc || "",
      short_ar: ar.desc || service.desc || "",
      detail_en: service.desc || "",
      detail_ar: ar.desc || "",
      sort_order: index,
      visible: true,
    };
  });
  if (services.length) await upsert(url, key, "cms_services", services, "slug");

  const projects = [
    ...(site.PROJECTS || []).map((project, index) => ({
      id: project.id,
      title_en: project.name,
      title_ar: project.nameAr || project.name,
      category_en: project.type,
      category_ar: project.typeAr || project.type,
      area: project.area || null,
      description_en: project.desc || null,
      description_ar: project.descAr || project.desc,
      cover_url: project.img || null,
      video_url: null,
      pdf_url: project.pdf || null,
      external_url: null,
      tour360_url: null,
      sort_order: index,
      visible: true,
      images: project.images || [],
    })),
    ...(site.VIDEO_PROJECTS || []).map((project, index) => ({
      id: project.id,
      title_en: project.name,
      title_ar: project.nameAr || project.name,
      category_en: project.type,
      category_ar: project.typeAr || project.type,
      area: project.area || null,
      description_en: null,
      description_ar: null,
      cover_url: project.cover || null,
      video_url: project.videoUrl || null,
      pdf_url: null,
      external_url: null,
      tour360_url: null,
      sort_order: 100 + index,
      visible: true,
      images: project.cover ? [project.cover] : [],
    })),
  ];
  if (projects.length) {
    await upsert(url, key, "cms_projects", projects.map(({ images, ...project }) => project), "id");
    const projectMedia = projects.flatMap((project) => (project.images || []).map((image, index) => ({
      project_id: project.id,
      media_type: "image",
      role: index === 0 ? "cover" : "gallery",
      url: image,
      sort_order: index,
      visible: true,
    })));
    if (projectMedia.length) await upsert(url, key, "cms_project_media", projectMedia, "project_id,url");
  }

  const teamGroups = [
    ["owners", "leadership"],
    ["accounting", "leadership"],
    ["site", "site"],
    ["design", "design"],
  ];
  const members = teamGroups.flatMap(([keyName, department]) => (site.TEAM?.[keyName] || []).map((member, index) => {
    const name = (member.name || member.nameAr || "").toLowerCase();
    let imageUrl = null;
    
    if (name.includes("راجح") || name.includes("rajeh")) imageUrl = "/team-real/ahmed-rajeh.png";
    else if (name.includes("الدمياطي") || name.includes("domiaty")) imageUrl = "/team-real/ebrahem-al-domiaty.png";
    else if (name.includes("صبيحة") || name.includes("sabiha")) imageUrl = "/team-real/khaled-sabiha.png";
    else if (name.includes("روان") || name.includes("rawan")) imageUrl = "/team-real/rawan-el-bargesy.png";
    else if (name.includes("أسماء علاء") || name.includes("asmaa alaa")) imageUrl = "/team-real/asmaa-alaa.png";
    else if (name.includes("هالة") || name.includes("hala")) imageUrl = "/team-real/hala-ibrahem.png";
    else if (name.includes("لمياء") || name.includes("lamiaa")) imageUrl = "/team-real/lamiaa-el-halwany.png";
    else if (name.includes("زياد") || name.includes("zeyad")) imageUrl = "/team-real/zeyad-el-salamony.png";
    else if (name.includes("زيدي") || name.includes("zedy")) imageUrl = "/team-real/muhamed-el-zedy.png";
    else if (name.includes("عيسى") || name.includes("eissa")) imageUrl = "/team-real/muhamed-eissa.png";
    else if (name.includes("قويطة") || name.includes("qwita")) imageUrl = "/team-real/rabab-abdo-qwita.png";
    else if (name.includes("أمنية") || name.includes("omnia")) imageUrl = "/team-real/omnia-abd-el-salam.png";
    else if (name.includes("هايدي") || name.includes("haidy")) imageUrl = "/team-real/haidy-galal.png";
    else if (name.includes("ياقوت") || name.includes("yakout")) imageUrl = "/team-real/ahmed-yakout.png";
    else if (name.includes("هضيبي") || name.includes("hidaby")) imageUrl = "/team-real/hend-el-hidaby.png";
    else if (name.includes("يارا") || name.includes("yara")) imageUrl = "/team-real/yara-el-shabrawy.png";
    else if (name.includes("أماني") || name.includes("amany")) imageUrl = "/team-real/amany-safan.png";
    else if (name.includes("غانم") || name.includes("ghaneem") || name.includes("أسماء غانم")) imageUrl = "/team-real/asmaa-ghaneem.png";

    return {
      slug: slugify(`${keyName}-${member.name}`),
      name_en: member.name || member.nameAr,
      name_ar: member.nameAr || member.name,
      role_en: member.role || member.roleAr,
      role_ar: member.roleAr || member.role,
      department,
      image_url: imageUrl,
      sort_order: membersSortOffset(keyName) + index,
      visible: true,
    };
  }));
  if (members.length) await upsert(url, key, "cms_team_members", members, "slug");

  const client = await upsert(url, key, "cms_clients", [{
    slug: "tact-clients",
    name_en: "Tact Clients",
    name_ar: "عملاء تاكت",
    description_en: "Published client feedback and review videos.",
    description_ar: "آراء العملاء وفيديوهات التجارب المنشورة.",
    sort_order: 1,
    visible: true,
  }], "slug");
  const clientId = client?.[0]?.id;
  const reviews = [
    ...(site.TESTIMONIALS_AR || []).map((quote, index) => ({
      client_id: clientId,
      client_name_en: `Tact Client ${index + 1}`,
      client_name_ar: "عميل تاكت",
      role_en: "Client",
      role_ar: "عميل",
      quote_en: quote,
      quote_ar: quote,
      rating: 5,
      image_url: null,
      video_url: null,
      video_cover_url: null,
      sort_order: index,
      visible: true,
    })),
    ...(site.REVIEW_VIDEOS || []).map((video, index) => ({
      client_id: clientId,
      client_name_en: video.client || "Tact Client",
      client_name_ar: video.client || "عميل تاكت",
      role_en: "Video Review",
      role_ar: "رأي فيديو",
      quote_en: video.title || "",
      quote_ar: video.title || "",
      rating: 5,
      image_url: null,
      video_url: video.videoUrl,
      video_cover_url: video.cover,
      sort_order: 100 + index,
      visible: true,
    })),
  ];
  if (reviews.length) await upsert(url, key, "cms_client_testimonials", reviews, null);

  await upsert(url, key, "cms_contact_settings", [{
    id: true,
    phone_numbers: site.SITE?.phones || [],
    whatsapp: site.SITE?.whatsapp || "",
    email: site.SITE?.email || "",
    social_links: {
      facebook: site.SITE?.facebook,
      instagram: site.SITE?.instagram,
      tiktok: site.SITE?.tiktok,
    },
    title_en: "Contact",
    title_ar: "تواصل معنا",
    body_en: "Send your project details and our team will contact you.",
    body_ar: "ابعث تفاصيل مشروعك وفريقنا هيتواصل معاك.",
  }], "id");

  console.log(JSON.stringify({
    backupPath,
    pages: pages.length,
    sections: sections.length,
    services: services.length,
    projects: projects.length,
    team_members: members.length,
    reviews: reviews.length,
  }, null, 2));
}

function membersSortOffset(keyName) {
  return { owners: 0, accounting: 20, site: 40, design: 60 }[keyName] || 100;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
