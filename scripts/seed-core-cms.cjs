const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

function readEnv() {
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    env[line.slice(0, idx)] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return { ...env, ...process.env };
}

async function upsert(url, key, table, rows, conflict) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  endpoint.searchParams.set("on_conflict", conflict);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
}

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");

  const pages = [
    ["home", "Home", "الرئيسية"],
    ["about", "About", "من نحن"],
    ["services", "Services", "خدماتنا"],
    ["portfolio", "Portfolio", "أعمالنا"],
    ["team", "Team", "فريق العمل"],
    ["testimonials", "Clients", "العملاء"],
    ["contact", "Contact", "تواصل معنا"],
  ].map(([slug, title_en, title_ar], index) => ({ slug, title_en, title_ar, sort_order: index + 1, published: true }));

  const services = [
    { num: "01", title: "التصميم الداخلي", desc: "تصميم مساحات سكنية وتجارية تجمع بين الجمال والوظيفة." },
    { num: "02", title: "التصميم الخارجي", desc: "واجهات ومداخل ولاندسكيب بهوية معمارية واضحة." },
    { num: "03", title: "التشطيبات المتكاملة", desc: "تنفيذ من الألف إلى الياء بجودة متابعة دقيقة." },
    { num: "04", title: "الأثاث والديكور", desc: "حلول أثاث وديكور متناسقة مع التصميم والتنفيذ." },
  ];
  const servicesEn = [
    { num: "01", title: "Interior Design", desc: "Residential and commercial spaces balancing beauty and function." },
    { num: "02", title: "Exterior Design", desc: "Facades, entrances, and landscape with a clear architectural identity." },
    { num: "03", title: "Full Finishing", desc: "End-to-end execution with close quality follow-up." },
    { num: "04", title: "Furniture & Decor", desc: "Furniture and decor solutions aligned with the full design." },
  ];
  const designs = [
    {
      id: "landscape",
      name: "Landscape Design",
      nameAr: "تصميم لاندسكيب",
      type: "Design",
      typeAr: "تصميم",
      img: "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
      desc: "Outdoor design sample from real project material.",
      descAr: "نموذج تصميم خارجي من ملفات الأعمال الحقيقية.",
    },
    {
      id: "shop-facade",
      name: "Shop Facade",
      nameAr: "واجهة تجارية",
      type: "Commercial",
      typeAr: "تجاري",
      img: "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
      desc: "Commercial facade design.",
      descAr: "تصميم واجهة تجارية.",
    },
    {
      id: "students-cafe",
      name: "Students Cafe",
      nameAr: "كافيه طلابي",
      type: "Commercial",
      typeAr: "تجاري",
      img: "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
      desc: "Cafe and social space design.",
      descAr: "تصميم كافيه ومساحة اجتماعية.",
    },
  ];
  const videos = [
    {
      id: "luxury-modern",
      name: "Luxury Modern",
      nameAr: "تشطيب مودرن فاخر",
      type: "Finishing Video",
      typeAr: "فيديو تشطيب",
      cover: "/real-content/Finishing videos/Luxury modern-thumb.webp",
      videoUrl: "/real-content/Finishing videos/Luxury modern.mp4",
    },
    {
      id: "new-classic",
      name: "New Classic",
      nameAr: "تشطيب نيو كلاسيك",
      type: "Finishing Video",
      typeAr: "فيديو تشطيب",
      cover: "/real-content/Finishing videos/New classic-thumb.webp",
      videoUrl: "/real-content/Finishing videos/New classic.mp4",
    },
  ];
  const team = {
    owners: [
      { name: "Ahmed Rajeh", nameAr: "أحمد راجح", role: "Civil Engineer", roleAr: "مهندس مدني" },
      { name: "Ebrahem Al-Domiaty", nameAr: "إبراهيم الدمياطي", role: "General Manager - Architect", roleAr: "المدير العام - مهندس معماري" },
      { name: "Khaled Sabiha", nameAr: "خالد صبيحة", role: "Architect", roleAr: "مهندس معماري" },
    ],
    accounting: [
      { name: "Rawan El-Bargesy", nameAr: "روان البرجيسي", role: "Accounts Manager", roleAr: "مدير الحسابات" },
      { name: "Hala Ibraheem", nameAr: "هالة إبراهيم", role: "Customer Follow-up & Marketing", roleAr: "متابعة العملاء والتسويق" },
    ],
    site: [
      { name: "Zeyad El-Salamony", nameAr: "زياد السلاموني", role: "Executive Engineer", roleAr: "مهندس تنفيذي" },
      { name: "Muhamed Eissa", nameAr: "محمد عيسى", role: "Executive Engineer", roleAr: "مهندس تنفيذي" },
    ],
    design: [
      { name: "Rabab Abdo Qwita", nameAr: "رباب عبدة قويطة", role: "Head of Design", roleAr: "رئيسة قسم التصميم" },
      { name: "Omnia Abd El-Salam", nameAr: "أمنية عبد السلام", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    ],
  };
  const contacts = {
    phones: ["01032473330", "01015097759", "01032533305"],
    whatsapp: "201032473330",
    email: "info@tact-eg.com",
    facebook: "https://www.facebook.com/share/1Dp3pAYnh5/",
    instagram: "https://www.instagram.com/tactdecoration?igsh=MTI3NjhiZDR4ZW4yaQ==",
    tiktok: "https://www.tiktok.com/@tact.decorations?_r=1&_t=ZS-93kdjbYCnUg",
  };

  const blocks = [
    ["home", "hero", "hero", "Tact Architecture & Decoration", "تاكت للعمارة والديكور", "Integrated design, finishing, decoration, and furniture services.", "تصميم وتشطيب وديكور وأثاث بخدمة متكاملة من الفكرة حتى التسليم.", "/real-content/Finishing videos/Luxury modern.mp4", {}, 1],
    ["home", "intro", "text", "A complete finishing experience", "تجربة تشطيب متكاملة", "We manage design, technical choices, execution follow-up, and handover.", "ندير التصميم واختيارات الخامات ومتابعة التنفيذ والتسليم بتفاصيل واضحة.", "/real-content/Designs/Landscape/Screenshot_14-5-2026_185938_.webp", {}, 2],
    ["about", "hero", "hero", "About Tact", "من نحن", "A specialized architecture and decoration team focused on practical luxury.", "فريق متخصص في العمارة والديكور يقدم رفاهية عملية قابلة للتنفيذ.", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp", {}, 1],
    ["about", "process", "text", "From idea to handover", "من الفكرة إلى التسليم", "Consultation, design, execution, finishing, and final handover with engineering follow-up.", "استشارة وتصميم وتنفيذ وتشطيب وتسليم نهائي بمتابعة هندسية.", "/real-content/Designs/students cafe/Screenshot_14-5-2026_191913_.webp", {}, 2],
    ["services", "hero", "hero", "Our Services", "خدماتنا", "Services built for residential, commercial, and office projects.", "خدمات مصممة للمشروعات السكنية والتجارية والإدارية.", "/real-content/Designs/Landscape/Screenshot_14-5-2026_19021_.webp", {}, 1],
    ["services", "services-list", "list", "What we do", "ماذا نقدم", "", "", "", { services_ar: services, services_en: servicesEn }, 2],
    ["portfolio", "hero", "hero", "Our Work", "أعمالنا", "Real designs, finishing videos, and project references.", "تصميمات وفيديوهات تشطيب ومراجع أعمال حقيقية.", "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp", {}, 1],
    ["portfolio", "projects", "collection", "Selected projects", "نماذج من أعمالنا", "", "", "", { designs, videos }, 2],
    ["team", "hero", "hero", "Meet The Team", "فريق العمل", "Engineering, design, execution, and customer follow-up teams.", "فريق هندسي وتصميم وتنفيذ ومتابعة عملاء.", "/real-content/Designs/Landscape/Screenshot_14-5-2026_19049_.webp", {}, 1],
    ["team", "team-directory", "collection", "Our people", "فريقنا", "", "", "", { team }, 2],
    ["testimonials", "hero", "hero", "Clients", "العملاء", "Client feedback and real experience videos.", "آراء العملاء وفيديوهات تجارب حقيقية.", "/real-content/Customers Reviews/Customers Reviews-thumb.webp", {}, 1],
    ["testimonials", "reviews", "collection", "Client feedback", "آراء العملاء", "", "", "", { review_videos: videos.map((v) => ({ ...v, title: v.nameAr, client: "Tact Client" })), testimonials_ar: ["التنفيذ كان منظم والتسليم كان واضح.", "فريق محترم ومتابعة ممتازة.", "التصميم طلع مطابق للتوقعات."] }, 2],
    ["contact", "hero", "hero", "Contact Us", "تواصل معنا", "Send your project details and our team will contact you.", "ابعث تفاصيل مشروعك وفريقنا هيتواصل معاك.", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191737_.webp", {}, 1],
    ["contact", "contact-info", "contact", "Contact details", "بيانات التواصل", "", "", "", { contacts }, 2],
  ].map(([page_slug, block_key, block_type, title_en, title_ar, body_en, body_ar, media_url, metadata, sort_order]) => ({
    page_slug, block_key, block_type, title_en, title_ar, body_en, body_ar, media_url: media_url || null, metadata, sort_order, published: true,
  }));

  await upsert(url, key, "site_pages", pages, "slug");
  await upsert(url, key, "content_blocks", blocks, "page_slug,block_key");
  await upsert(url, key, "site_settings", { key: "contact", value: contacts }, "key");
  console.log(`Seeded ${pages.length} pages and ${blocks.length} blocks.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
