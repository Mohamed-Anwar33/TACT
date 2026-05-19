export const SITE = {
  phones: ["01032473330", "01015097759", "01032533305"],
  whatsapp: "201032473330",
  facebook: "https://www.facebook.com/share/1Dp3pAYnh5/",
  instagram: "https://www.instagram.com/tactdecoration?igsh=MTI3NjhiZDR4ZW4yaQ==",
  tiktok: "https://www.tiktok.com/@tact.decorations?_r=1&_t=ZS-93kdjbYCnUg",
  email: "info@tact-eg.com",
};

export const whatsappLink = (msg = "") =>
  `https://wa.me/${SITE.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

export const SERVICES_AR = [
  { num: "01", title: "التصميم الداخلي", desc: "رؤية هندسية متكاملة لتصميم وتنسيق الفراغات الداخلية بأعلى معايير الجمال والوظيفة." },
  { num: "02", title: "التصميم الخارجي", desc: "واجهات وحدائق ومداخل مصممة بهوية معمارية راقية." },
  { num: "03", title: "تنفيذ تشطيبات خارجية", desc: "تنفيذ كلي لكافة بنود التشطيبات والواجهات الخارجية بأعلى معايير الجودة والدقة." },
  { num: "04", title: "تنفيذ تشطيبات داخلية", desc: "سكني - إداري - تجاري (من الطوب الأحمر حتى تنفيذ الفرش المتكامل بأعلى مستويات الجودة)." },
  { num: "05", title: "تنفيذ المشروعات التجارية والإدارية", desc: "محلات، عيادات، مكاتب، ومقرات إدارية." },
  { num: "06", title: "الأثاث والديكور", desc: "قطع أثاث مفصلة وتنسيق ديكور يعكس هوية المساحة." },
  { num: "07", title: "الإشراف الهندسي", desc: "متابعة دقيقة على كل مرحلة لضمان جودة التنفيذ." },
  { num: "08", title: "تسليم مفتاح", desc: "نسلّم المساحة جاهزة للسكن بأدق التفاصيل." },
];

export const SERVICES_EN = [
  { num: "01", title: "Interior & Space Design", desc: "Integrated architectural vision to design interior spaces with beauty and functionality." },
  { num: "02", title: "Exterior Design", desc: "Facades, gardens, and entrances with refined architectural identity." },
  { num: "03", title: "Exterior Finishing Execution", desc: "Complete execution of exterior finishing works and facades at the highest quality standards." },
  { num: "04", title: "Interior Finishing Execution", desc: "Residential, administrative, and commercial - from red brick to fully furnished delivery." },
  { num: "05", title: "Commercial & Office Execution", desc: "Shops, clinics, offices, and corporate spaces." },
  { num: "06", title: "Furniture & Decor", desc: "Custom furniture pieces and styling that reflect your identity." },
  { num: "07", title: "Engineering Supervision", desc: "Precise oversight at every phase for guaranteed quality." },
  { num: "08", title: "Turn-Key Delivery", desc: "We hand over the space ready to live in, down to the last detail." },
];

export const TEAM = {
  owners: [
    { name: "Ahmed Rajeh", nameAr: "أحمد راجح", role: "Civil Engineer", roleAr: "مهندس مدني" },
    { name: "Ebrahem Al-Domiaty", nameAr: "إبراهيم الدمياطي", role: "General Manager - Architect", roleAr: "المدير العام - مهندس معماري" },
    { name: "Khaled Sabiha", nameAr: "خالد صبيحة", role: "Architect", roleAr: "مهندس معماري" },
  ],
  accounting: [
    { name: "Rawan El-Bargesy", nameAr: "روان البرجيسي", role: "Accounts Manager", roleAr: "مدير الحسابات" },
    { name: "Asmaa Alaa", nameAr: "أسماء علاء", role: "Accountant", roleAr: "محاسبة" },
    { name: "Hala Ibrahem", nameAr: "هالة إبراهيم", role: "Customer Follow-up and Marketing", roleAr: "متابعة العملاء والتسويق" },
  ],
  site: [
    { name: "Lamiaa El-Halwany", nameAr: "لمياء الحلواني", role: "Quality Control Engineer", roleAr: "مهندسة ضبط الجودة" },
    { name: "Zeyad El-Salamony", nameAr: "زياد السلاموني", role: "Architect - Executive Engineer", roleAr: "مهندس معماري تنفيذي" },
    { name: "Muhamed El-Zedy", nameAr: "محمد الزيدي", role: "Architect - Executive Engineer", roleAr: "مهندس معماري تنفيذي" },
    { name: "Muhamed Eissa", nameAr: "محمد عيسى", role: "Architect - Executive Engineer", roleAr: "مهندس معماري تنفيذي" },
  ],
  design: [
    { name: "Rabab Abdo Qwita", nameAr: "رباب عبده قويطة", role: "Head of Design", roleAr: "رئيسة قسم التصميم" },
    { name: "Omnia Abd El-Salam", nameAr: "أمنية عبد السلام", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    { name: "Haidy Galal", nameAr: "هايدي جلال", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    { name: "Ahmed Yakout", nameAr: "أحمد ياقوت", role: "Design Engineer", roleAr: "مهندس تصميم" },
    { name: "Hend El-Hidaby", nameAr: "هند الهضيبي", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    { name: "Yara El-Shabrawy", nameAr: "يارا الشبراوي", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    { name: "Amany Safan", nameAr: "أماني سفان", role: "Design Engineer", roleAr: "مهندسة تصميم" },
    { name: "Asmaa Ghaneem", nameAr: "أسماء غانم", role: "Design Engineer", roleAr: "مهندسة تصميم" },
  ],
};

export const PROJECTS = [];


export const VIDEO_PROJECTS = [
  { id: "v1", name: "Luxury modern", nameAr: "شقة فاخرة مودرن", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "280 m²", videoUrl: "/real-content/Finishing videos/Luxury modern.mp4", cover: "/real-content/Finishing videos/Luxury modern-thumb.webp" },
  { id: "v2", name: "Luxury New classic", nameAr: "شقة فاخرة نيو كلاسيك", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "310 m²", videoUrl: "/real-content/Finishing videos/Luxury New classic.mp4", cover: "/real-content/Finishing videos/Luxury New classic-thumb.webp" },
  { id: "v3", name: "New classic", nameAr: "تشطيب نيو كلاسيك مميز", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "190 m²", videoUrl: "/real-content/Finishing videos/New classic.mp4", cover: "/real-content/Finishing videos/New classic-thumb.webp" },
  { id: "v4", name: "Commercial Classic", nameAr: "مقر تجاري كلاسيك", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "400 m²", videoUrl: "/real-content/Finishing videos/تجاري كلاسيك.mp4", cover: "/real-content/Finishing videos/تجاري كلاسيك-thumb.webp" },
  { id: "v5", name: "Commercial Modern", nameAr: "مقر تجاري مودرن", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "120 m²", videoUrl: "/real-content/Finishing videos/تجاري مودرن.mp4", cover: "/real-content/Finishing videos/تجاري مودرن-thumb.webp" },
  { id: "v6", name: "Classic Apartment", nameAr: "شقة كلاسيك متكاملة", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "165 m²", videoUrl: "/real-content/Finishing videos/شقة كلاسيك.mp4", cover: "/real-content/Finishing videos/شقة كلاسيك-thumb.webp" },
  { id: "v7", name: "Modern Apartment 1", nameAr: "شقة مودرن راقية", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "180 m²", videoUrl: "/real-content/Finishing videos/شقة مودرن 1.mp4", cover: "/real-content/Finishing videos/شقة مودرن 1-thumb.webp" },
  { id: "v8", name: "Modern Apartment 150m", nameAr: "شقة مودرن 150 م²", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "150 m²", videoUrl: "/real-content/Finishing videos/شقة مودرن ١٥٠ م.mp4", cover: "/real-content/Finishing videos/شقة مودرن ١٥٠ م-thumb.webp" },
  { id: "v9", name: "Modern Apartment 220m", nameAr: "شقة مودرن 220 م²", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "220 m²", videoUrl: "/real-content/Finishing videos/شقة مودرن ٢٢٠ م.mp4", cover: "/real-content/Finishing videos/شقة مودرن ٢٢٠ م-thumb.webp" },
  { id: "v10", name: "Modern Apartment Luxe", nameAr: "شقة مودرن استثنائية", type: "Finishing Videos", typeAr: "فيديوهات التشطيب", area: "250 m²", videoUrl: "/real-content/Finishing videos/شقة مودرن.mp4", cover: "/real-content/Finishing videos/شقة مودرن-thumb.webp" },
];

export const REVIEW_VIDEOS = [
  {
    id: "rv1",
    title: "مقابلة ورأي العميل المباشر بعد استلام الوحدة",
    client: "عميل مميز",
    videoUrl: "/real-content/Customers Reviews/فيديو اراء العملاء.mp4",
    cover: "/real-content/Customers Reviews/فيديو اراء العملاء-thumb.webp"
  },
  {
    id: "rv2",
    title: "توثيق مرئي لآراء العملاء ومستوى رضاهم عن التشطيب",
    client: "إدارة المشاريع",
    videoUrl: "/real-content/Customers Reviews/Customers Reviews.mp4",
    cover: "/real-content/Customers Reviews/Customers Reviews-thumb.webp"
  }
];

export const TESTIMONIALS_AR = [
  "ما شاء الله يا مهندس، حاجة جميلة ما شاء الله، الله يعطيك العافية يا رب.",
  "ما شاء الله عليكم، إحنا مبسوطين جدًا، ربنا يوفقكم يا رب ويحسن ما بين أيديكم.",
  "ما شاء الله التصميم جميل جدًا، توكل على الله.",
  "ما شاء الله، شكرًا جدًا لمجهودكم على كل تفصيلة في الشقة، وإحنا فخورين بالتعامل معاكم.",
  "ما شاء الله، التصميم جميل فعلًا.",
  "ما شاء الله حاجة جميلة، الله يبارك فيكم جميعًا.",
];

export const PACKAGES = [
  { 
    id: "economy", 
    name: "Basic", 
    nameAr: "باقة أساسية", 
    price: "6,000", 
    featured: false,
    descAr: "باقة مثالية للشركات الناشئة ورواد الأعمال الذين يحتاجون إلى الأدوات الأساسية للانطلاق بثقة.",
    desc: "Ideal for startups and entrepreneurs who need the essential tools to launch with confidence.",
    featuresAr: ["الخصائص الأساسية", "دعم فني في أوقات العمل", "تقارير أساسية", "تحديثات دورية"],
    featuresEn: ["Core features", "Business hours support", "Basic reporting", "Periodic updates"]
  },
  { 
    id: "medium", 
    name: "Standard", 
    nameAr: "باقة متوسطة", 
    price: "8,000", 
    featured: true,
    badgeAr: "الأفضل قيمة",
    badgeEn: "Best Value",
    descAr: "باقة متوازنة تمنحك جميع الأدوات والخصائص الأساسية لإدارة أعمالك بكفاءة وتحقيق نمو مستدام.",
    desc: "A balanced package that gives you all the essential tools to manage your business efficiently.",
    featuresAr: ["تجربة سلسة وسريعة", "دعم فني متواصل", "تقارير وتحليلات دورية", "تحديثات وميزات مستمرة"],
    featuresEn: ["Smooth & fast experience", "Continuous support", "Periodic reports & analytics", "Ongoing updates & features"]
  },
  { 
    id: "luxury", 
    name: "Premium", 
    nameAr: "باقة فاخرة", 
    price: "10,000", 
    featured: false,
    descAr: "باقة متكاملة مصممة للشركات الكبيرة التي تحتاج إلى حلول متقدمة ودعم مخصص وتجربة احترافية بلا حدود.",
    desc: "A complete package designed for large enterprises requiring advanced solutions and dedicated support.",
    featuresAr: ["تجربة مستخدم متكاملة", "دعم فني مخصص 24/7", "تقارير وتحليلات متقدمة", "تكامل مع الأنظمة الأخرى"],
    featuresEn: ["Integrated user experience", "24/7 Dedicated support", "Advanced reports & analytics", "System integration"]
  },
];
