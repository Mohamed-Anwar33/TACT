const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "..");

function readEnv() {
  const envPath = path.join(root, ".env");
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (!line.includes("=") || line.trim().startsWith("#")) continue;
      const index = line.indexOf("=");
      env[line.slice(0, index)] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return { ...env, ...process.env };
}

const pages = [
  ["home", "Home", "الرئيسية"],
  ["about", "About", "من نحن"],
  ["services", "Services", "خدماتنا"],
  ["portfolio", "Portfolio", "أعمالنا"],
  ["team", "Team", "فريق العمل"],
  ["testimonials", "Clients", "العملاء"],
  ["contact", "Contact", "تواصل معنا"],
  ["presentations", "Presentations", "العروض والكتيبات"],
];

const homeSlides = [
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
  "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185938_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191947_.webp",
];

const aboutSlides = [
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
  "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191955_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_19049_.webp",
];

const booklets = [
  ["landscape", "Landscape & Outdoor Spaces Design Booklet", "كتيب تصميم اللاندسكيب والمناظر الطبيعية", "/real-content/Designs/Landscape.pdf", "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp"],
  ["cafe", "Comprehensive Master Presentation - Students Cafe", "العرض التقديمي الشامل - كافيه طلابي", "/real-content/Designs/students cafe.pdf", "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp"],
  ["shop", "Premium Shop Facade Engineering Specs", "كتيب تفاصيل الواجهات التجارية", "/real-content/Designs/Shop facade.pdf", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp"],
  ["classic-1", "Luxury Classic Style Blueprints - Vol 1", "كتيب المخططات الكلاسيكية الفاخرة", "/real-content/Designs/ملفات pdf/Classic Styles/download.pdf", "/real-content/Designs/Landscape/Screenshot_14-5-2026_19049_.webp"],
  ["classic-2", "Classic Style Interior Concepts - Vol 2", "العرض التقديمي للتصاميم الكلاسيكية", "/real-content/Designs/ملفات pdf/Classic Styles/download1.pdf", "/real-content/Designs/Landscape/Screenshot_14-5-2026_1912_.webp"],
  ["neoclassic", "Neo Classic Minimalist Harmony Specs", "كتيب الطراز النيو كلاسيك الحديث", "/real-content/Designs/ملفات pdf/Neo Classic Styles/download.pdf", "/real-content/Designs/Landscape/Screenshot_14-5-2026_19153_.webp"],
];

const aboutBodyAr = [
  "نحن شركة متخصصة في التصميم والتنفيذ والتشطيبات المتكاملة، نعمل برؤية هندسية دقيقة ومعايير تنفيذ عالية.",
  "نمتلك خبرة تمتد لأكثر من 12 عامًا في إدارة وتنفيذ المشروعات السكنية والإدارية.",
  "نفذنا بنجاح أكثر من 60 مشروعًا، مع التزام كامل بالجودة، والدقة، واحترام تفاصيل كل مساحة.",
  "نقدّم تجربة متكاملة تبدأ من استلام الوحدة وحتى مرحلة الفرش والتسليم النهائي، بما يعكس هوية عملائنا ويواكب أعلى مستويات الرقي.",
].join("\n\n");

const aboutBodyEn = [
  "We are a firm specialized in integrated design, execution, and finishing, operating with precise architectural vision and high execution standards.",
  "We possess over 12 years of experience in managing and delivering residential and administrative projects.",
  "We have successfully completed over 60 projects, with full commitment to quality, precision, and respect for the details of every space.",
  "We offer a comprehensive experience starting from unit handover to furnishing and final delivery, reflecting our clients' identity and matching the highest levels of refinement.",
].join("\n\n");

const sections = [
  ["home", "hero", "Hero Section", "قسم البداية", "Tact Architecture & Decoration", "تاكت للعمارة والديكور", "Integrated design, finishing, and decoration experience.", "تجربة متكاملة في التصميم والتشطيب والديكور.", "/questionnaire", "Start Project", "ابدأ مشروعك", 1],
  ["home", "stats-strip", "Stats Strip", "شريط الإحصائيات", "12+ years, 60+ projects, end-to-end delivery", "أكثر من 12 سنة خبرة، وأكثر من 60 مشروع ناجح، وخدمة متكاملة", "Years experience / successful projects / design, build, finish / residential, commercial, office.", "سنوات خبرة / مشاريع ناجحة / تصميم وتنفيذ وتشطيب / سكني وتجاري وإداري.", null, null, null, 2],
  ["home", "about-preview", "About Preview", "نبذة مختصرة", "Engineering Meaning Inside Every Space", "هندسة المعنى داخل كل مساحة", aboutBodyEn, aboutBodyAr, "/about", "Learn More", "اعرف عنا أكثر", 3],
  ["home", "services-preview", "Services Preview", "مختصر الخدمات", "A complete experience, detail by detail", "تجربة متكاملة، تفصيلاً تلو الآخر", "Public services cards are stored in cms_services.", "كروت الخدمات المعروضة مخزنة في جدول الخدمات.", "/services", "View All", "عرض الكل", 4],
  ["home", "works-preview", "Works Preview", "مختصر الأعمال", "Our Actual Works & Designs", "أعمالنا وتصميماتنا الفعلية", "Public project cards are stored in cms_projects and cms_project_media.", "كروت الأعمال مخزنة في جداول المشاريع والميديا.", "/portfolio", "View Work", "عرض الأعمال", 5],
  ["home", "pdf-booklets", "PDF Booklets", "الكتيبات الفنية", "Technical Booklets & Presentations", "الكتيبات الفنية والعروض التقديمية", "Engineering PDFs and technical presentations attached to this section.", "ملفات PDF والعروض الفنية مربوطة بهذا القسم.", "/presentations", "Open Presentations", "فتح العروض", 6],
  ["home", "team-preview", "Team Preview", "مختصر الفريق", "Minds Behind Details", "العقول خلف التفاصيل", "Team members are stored in cms_team_members.", "أعضاء الفريق مخزنون في جدول فريق العمل.", "/team", "View Team", "عرض الفريق", 7],
  ["home", "testimonials", "Testimonials", "آراء العملاء", "Trust Built With Every Handover", "ثقة تُبنى مع كل تسليم", "Client feedback and review videos are stored in cms_client_testimonials.", "آراء العملاء والفيديوهات مخزنة في جدول آراء العملاء.", "/testimonials", "Clients", "العملاء", 8],
  ["home", "packages-cta", "Packages CTA", "دعوة الباقات", "Select Your Finishing Tier", "اختر الباقة الأنسب لمساحتك", "Package content is managed from package tables and payment unlocks.", "محتوى الباقات يدار من جداول الباقات والتفعيل بعد الدفع.", "/packages", "Packages", "الباقات", 9],
  ["home", "final-cta", "Final CTA", "دعوة التواصل النهائية", "Let us shape your next space", "خلينا نبدأ مساحة جديدة", "Final call-to-action leading to contact and questionnaire.", "دعوة نهائية للتواصل أو بدء الاستبيان.", "/contact", "Contact", "تواصل معنا", 10],

  ["about", "hero", "Hero Section", "قسم البداية", "Engineering Meaning Inside Every Space", "هندسة المعنى داخل كل مساحة", null, null, null, null, null, 1],
  ["about", "intro", "Intro Content", "محتوى التعريف", "About Tact", "من نحن", aboutBodyEn, aboutBodyAr, null, null, null, 2],
  ["about", "process", "Process Overview", "رحلتنا", "From idea to keys", "من الفكرة إلى المفتاح", "Consultation, design, execution, finishing and furnishing, final handover.", "الاستشارة، التصميم، التنفيذ، التشطيب والفرش، التسليم.", null, null, null, 3],
  ["about", "process-consultation", "Process: Consultation", "مرحلة الاستشارة", "Consultation", "الاستشارة", "We understand your vision and needs.", "نفهم رؤيتك واحتياجك.", null, null, null, 4],
  ["about", "process-design", "Process: Design", "مرحلة التصميم", "Design", "التصميم", "Precise 3D visualization.", "تصور ثلاثي الأبعاد دقيق.", null, null, null, 5],
  ["about", "process-execution", "Process: Execution", "مرحلة التنفيذ", "Execution", "التنفيذ", "Full management at top standards.", "إدارة شاملة بأعلى المعايير.", null, null, null, 6],
  ["about", "process-finishing", "Process: Finishing & Furnishing", "مرحلة التشطيب والفرش", "Finishing & Furnishing", "التشطيب والفرش", "Material and piece selection.", "اختيار المواد والقطع.", null, null, null, 7],
  ["about", "process-handover", "Process: Handover", "مرحلة التسليم", "Handover", "التسليم", "A space ready down to the details.", "مساحة جاهزة بأدق التفاصيل.", null, null, null, 8],
  ["about", "values", "Values Overview", "قيمنا", "What makes us Tact", "ما الذي يجعلنا تاكت", "Quality, delivery, customization, supervision, integrated execution, refined handover.", "الجودة، الالتزام، التصميم المخصص، الإشراف، التنفيذ المتكامل، التسليم الراقي.", null, null, null, 9],
  ["about", "value-quality", "Value: High Quality", "قيمة: جودة عالية", "High Quality", "جودة عالية", "Strict standards in every detail.", "معايير صارمة في كل تفصيلة.", null, null, null, 10],
  ["about", "value-delivery", "Value: On-Time Delivery", "قيمة: الالتزام بالمواعيد", "On-Time Delivery", "التزام بالمواعيد", "We deliver on agreed schedules.", "نسلم في الوقت المتفق عليه.", null, null, null, 11],
  ["about", "value-custom", "Value: Custom Design", "قيمة: تصميم مخصص", "Custom Design", "تصميم مخصص", "Designed to your identity and needs.", "نصمم على هويتك واحتياجك.", null, null, null, 12],
  ["about", "value-supervision", "Value: Engineering Supervision", "قيمة: إشراف هندسي", "Engineering Supervision", "إشراف هندسي", "Precise oversight at every stage.", "متابعة دقيقة لكل مرحلة.", null, null, null, 13],
  ["about", "value-integrated", "Value: Integrated Execution", "قيمة: تنفيذ متكامل", "Integrated Execution", "تنفيذ متكامل", "From idea to keys.", "من الفكرة إلى المفتاح.", null, null, null, 14],
  ["about", "value-handover", "Value: Refined Handover", "قيمة: تسليم راق", "Refined Handover", "تسليم نهائي راق", "A handover experience worthy of you.", "تجربة تسليم تليق بك.", null, null, null, 15],

  ["services", "hero", "Hero Section", "قسم البداية", "A complete experience, detail by detail", "تجربة متكاملة، تفصيلاً تلو الآخر", "From first meeting to final handover, every service is structured around clear engineering execution.", "من أول مقابلة حتى التسليم النهائي، كل خدمة منظمة حول تنفيذ هندسي واضح.", null, null, null, 1],
  ["services", "services-list", "Services List", "قائمة الخدمات", "Services", "خدماتنا", "Managed by cms_services.", "تدار من جدول الخدمات.", null, null, null, 2],

  ["portfolio", "hero", "Hero Section", "قسم البداية", "Our Legacy", "سابقة أعمالنا", "We build a visual record of projects that are grounded in real execution, not presentation only.", "نوثق أعمالاً مبنية على تنفيذ واقعي وليس عرضاً فقط.", null, null, null, 1],
  ["portfolio", "projects-list", "Projects List", "قائمة الأعمال", "Portfolio", "أعمالنا", "Managed by cms_projects and cms_project_media.", "تدار من جداول المشاريع وميديا المشاريع.", null, null, null, 2],

  ["team", "hero", "Hero Section", "قسم البداية", "Meet Our Team", "تعرّف على فريقنا", "Engineering and administrative team behind every project stage.", "الفريق الهندسي والإداري خلف كل مرحلة في المشروع.", null, null, null, 1],
  ["team", "team-list", "Team List", "قائمة الفريق", "Team Members", "أعضاء فريق العمل", "Managed by cms_team_members.", "تدار من جدول فريق العمل.", null, null, null, 2],

  ["testimonials", "hero", "Hero Section", "قسم البداية", "Client Wall of Honor", "سجل الشرف لعملائنا", "We are proud of every handed-over space and every trust relationship.", "نفخر بكل مساحة سلمناها وبكل علاقة ثقة بنيناها.", null, null, null, 1],
  ["testimonials", "clients-list", "Clients & Reviews", "العملاء والآراء", "Client Feedback", "آراء العملاء", "Managed by cms_clients and cms_client_testimonials.", "تدار من جداول العملاء وآراء العملاء.", null, null, null, 2],

  ["contact", "hero", "Hero Section", "قسم البداية", "Let us start the conversation", "لنبدأ الحوار", "Send your project details and our team will contact you.", "ابعت تفاصيل مشروعك وفريقنا هيتواصل معاك.", null, null, null, 1],
  ["contact", "contact-info", "Contact Info", "بيانات التواصل", "Contact Details", "بيانات التواصل", "Phone, WhatsApp, email, social links and messages destination are managed here.", "الهاتف والواتساب والبريد والسوشيال ورسائل التواصل تدار من هنا.", null, null, null, 2],

  ["presentations", "hero", "Hero Section", "قسم البداية", "Technical Booklets & Presentations", "الكتيبات الفنية والعروض التقديمية", "Authentic project PDFs and technical masterplans.", "ملفات PDF الأصلية للمشاريع والمخططات التنفيذية.", null, null, null, 1],
  ["presentations", "booklets-list", "Booklets List", "قائمة الكتيبات", "PDF Booklets", "ملفات PDF", "All visible booklets are attached as section media.", "كل الكتيبات الظاهرة مرفقة كميديا داخل هذا القسم.", null, null, null, 2],
].map(([page_slug, section_key, section_name_en, section_name_ar, title_en, title_ar, body_en, body_ar, cta_url, cta_label_en, cta_label_ar, sort_order]) => ({
  page_slug,
  section_key,
  section_name_en,
  section_name_ar,
  title_en,
  title_ar,
  body_en,
  body_ar,
  cta_url,
  cta_label_en,
  cta_label_ar,
  sort_order,
  visible: true,
}));

async function main() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or service role key.");
  const supabase = createClient(url, key);

  const backupDir = path.join(root, "cms-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `visible-cms-audit-${Date.now()}.json`);

  const before = {};
  for (const table of ["cms_pages", "cms_sections", "cms_section_media", "cms_services", "cms_projects", "cms_project_media", "cms_team_members", "cms_clients", "cms_client_testimonials", "cms_contact_settings", "media_assets"]) {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    before[table] = count;
  }

  const pageRows = pages.map(([slug, title_en, title_ar], index) => ({
    slug,
    title_en,
    title_ar,
    nav_label_en: title_en,
    nav_label_ar: title_ar,
    sort_order: index + 1,
    visible: true,
  }));
  const { error: pageError } = await supabase.from("cms_pages").upsert(pageRows, { onConflict: "slug" });
  if (pageError) throw pageError;

  const { data: sectionRows, error: sectionError } = await supabase.from("cms_sections").upsert(sections, { onConflict: "page_slug,section_key" }).select("*");
  if (sectionError) throw sectionError;

  const sectionMap = new Map(sectionRows.map((row) => [`${row.page_slug}:${row.section_key}`, row.id]));
  const media = [];
  const addMedia = (key, role, mediaType, url, titleEn, titleAr, sortOrder) => {
    const section_id = sectionMap.get(key);
    if (!section_id || !url) return;
    media.push({ section_id, role, media_type: mediaType, url, title_en: titleEn || null, title_ar: titleAr || null, alt_en: titleEn || null, alt_ar: titleAr || null, sort_order: sortOrder, visible: true });
  };

  addMedia("home:hero", "video", "video", "/real-content/Finishing videos/Luxury modern.mp4", "Hero video", "فيديو البداية", 1);
  addMedia("home:hero", "poster", "image", "/real-content/Finishing videos/Luxury modern-thumb.webp", "Hero video poster", "غلاف فيديو البداية", 2);
  homeSlides.forEach((url, index) => addMedia("home:hero", "slide", "image", url, `Hero slide ${index + 1}`, `صورة بداية ${index + 1}`, 10 + index));
  aboutSlides.forEach((url, index) => addMedia("home:about-preview", "gallery", "image", url, `About preview ${index + 1}`, `صورة نبذة ${index + 1}`, index));
  addMedia("home:works-preview", "cover", "image", "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp", "Works preview cover", "غلاف الأعمال", 1);
  addMedia("home:testimonials", "video", "video", "/real-content/Customers Reviews/Customers Reviews.mp4", "Customer reviews video", "فيديو آراء العملاء", 1);
  booklets.forEach(([id, titleEn, titleAr, pdf, cover], index) => {
    addMedia("home:pdf-booklets", `booklet-cover-${id}`, "image", cover, titleEn, titleAr, index * 2);
    addMedia("home:pdf-booklets", `booklet-pdf-${id}`, "pdf", pdf, titleEn, titleAr, index * 2 + 1);
    addMedia("presentations:booklets-list", `booklet-cover-${id}`, "image", cover, titleEn, titleAr, index * 2);
    addMedia("presentations:booklets-list", `booklet-pdf-${id}`, "pdf", pdf, titleEn, titleAr, index * 2 + 1);
  });
  addMedia("about:intro", "image", "image", "/src/assets/about-detail.jpg", "About detail image", "صورة من نحن", 1);
  addMedia("portfolio:hero", "cover", "image", "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp", "Portfolio hero", "غلاف الأعمال", 1);
  addMedia("team:hero", "image", "image", "/src/assets/team-hero.png", "Team hero image", "صورة فريق العمل", 1);
  addMedia("contact:contact-info", "cover", "image", "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191737_.webp", "Contact cover", "غلاف التواصل", 1);

  const { error: mediaError } = await supabase.from("cms_section_media").upsert(media, { onConflict: "section_id,role,url" });
  if (mediaError) throw mediaError;

  const after = {};
  for (const table of Object.keys(before)) {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    after[table] = count;
  }

  const report = {
    audited_at: new Date().toISOString(),
    backup_note: "Non-destructive audit and sync. Existing public files remain in public/real-content or src/assets; Supabase stores metadata and links only.",
    routes_covered: ["/", "/about", "/services", "/portfolio", "/team", "/testimonials", "/contact", "/presentations"],
    entity_coverage: {
      services_table: "Services page and home services preview",
      projects_tables: "Portfolio page, home works preview, project details media",
      team_table: "Team page and home team preview",
      clients_tables: "Clients/testimonials page and home testimonials preview",
      contact_settings: "Contact page, header/footer/WhatsApp data source",
      sections_table: "Page-level titles, text blocks, CTA labels and per-section media",
      section_media_table: "Hero video/slides, about gallery, PDF booklets, review video, covers",
    },
    counts_before: before,
    counts_after: after,
  };
  fs.writeFileSync(backupPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ backupPath, ...report }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
