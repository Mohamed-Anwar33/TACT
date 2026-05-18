export interface ConfigOption {
  id: string;
  nameAr: string;
  nameEn: string;
  img: string;
  descAr: string;
  descEn: string;
}

export interface ConfigSection {
  id: string;
  nameAr: string;
  nameEn: string;
  options: ConfigOption[];
}

export interface PackageStyleConfig {
  styleId: string;
  styleNameAr: string;
  styleNameEn: string;
  sections: ConfigSection[];
}

// Helper to construct paths cleanly
const ECO_BASE = "/real-content/Packages/economy-20260514T162446Z-3-001/economy/styles/styles";
const MED_BASE = "/real-content/Packages/medium-20260514T162444Z-3-001/medium/styles/styles";
const LUX_BASE = "/real-content/Packages/luxury-20260514T162445Z-3-001/luxury/styles/styles";

export const PACKAGE_CONFIG_MAP: Record<string, PackageStyleConfig[]> = {
  economy: [
    {
      styleId: "modern",
      styleNameAr: "مودرن (Modern)",
      styleNameEn: "Modern",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب الداخلية",
          nameEn: "Internal Doors",
          options: [
            { id: "d1", nameAr: "باب مودرن قشرة أرو", nameEn: "Modern Oak Veneer Door", img: `${ECO_BASE}/modern/Doors/1.webp`, descAr: "تصميم انسيابي حديث مع دهانات بولي يوريثان عالية المتانة.", descEn: "Sleek modern layout with highly durable polyurethane paint." },
            { id: "d2", nameAr: "باب خشبي سادة مع تجاويف", nameEn: "Solid Wood Door with Grooves", img: `${ECO_BASE}/modern/Doors/2.webp`, descAr: "خطوط هندسية محفورة بدقة تضفي طابعاً عصرياً بسيطاً.", descEn: "Precisely engraved geometric lines adding a minimal modern character." },
            { id: "d3", nameAr: "باب دهان لاكيه أبيض", nameEn: "White Lacquer Door", img: `${ECO_BASE}/modern/Doors/3.webp`, descAr: "لون ناصع يعزز الإضاءة والشعور باتساع المساحة.", descEn: "Bright tone enhancing lighting and spatial perception." },
            { id: "d4", nameAr: "باب مودرن رمادي مطفي", nameEn: "Matte Grey Modern Door", img: `${ECO_BASE}/modern/Doors/4.webp`, descAr: "تشطيب عصري مطفي يتناغم مع الألوان المحايدة والدافئة.", descEn: "Matte modern finish harmonizing with neutral and warm palettes." },
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات (سيراميك وبورسلين)",
          nameEn: "Flooring (Ceramic & Porcelain)",
          options: [
            { id: "f1", nameAr: "سيراميك 60x60 فرز أول", nameEn: "Ceramic 60x60 Premium", img: `${ECO_BASE}/modern/Flooring/Ceramic/60 X 60 سيراميك.webp`, descAr: "بلاط سيراميك فاخر بأبعاد متناسقة ومقاومة عالية للاهتراء.", descEn: "Premium ceramic tiles with symmetrical dimensions and high wear resistance." },
            { id: "f2", nameAr: "سيراميك 120x60 مستطيل", nameEn: "Ceramic 120x60 Rectangular", img: `${ECO_BASE}/modern/Flooring/Ceramic/120 X 60 سيراميك.webp`, descAr: "شكل طولي عصري يمنح الصالات والممرات امتداداً بصرياً رائعاً.", descEn: "Modern elongated shape giving halls and corridors excellent visual extension." },
            { id: "f3", nameAr: "سيراميك بديل الباركيه", nameEn: "Wood-Look Ceramic", img: `${ECO_BASE}/modern/Flooring/Ceramic/سيراميك بديل الباركيه.webp`, descAr: "دفء الخشب الطبيعي مع صلابة السيراميك ومقاومته للماء.", descEn: "Warmth of natural wood combined with ceramic durability and water resistance." },
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف المعلقة (Gypsum Board)",
          nameEn: "Suspended Ceilings",
          options: [
            { id: "c1", nameAr: "سقف فلات مع إضاءة مخفية", nameEn: "Flat Ceiling with Cove Light", img: `${ECO_BASE}/modern/Ceiling/1.webp`, descAr: "توزيع إضاءة هادئ ومخفي على الأطراف يريح العين.", descEn: "Calm perimeter hidden lighting distribution soothing to the eye." },
            { id: "c2", nameAr: "سقف مودرن مع مسارات مغناطيسية", nameEn: "Modern Ceiling with Magnetic Tracks", img: `${ECO_BASE}/modern/Ceiling/2.webp`, descAr: "إمكانية تحريك وتوجيه وحدات الإضاءة بحرية تامة.", descEn: "Ability to move and direct lighting fixtures with absolute freedom." },
          ]
        },
        {
          id: "walls",
          nameAr: "دهانات وتجليد الحوائط",
          nameEn: "Walls Paints & Cladding",
          options: [
            { id: "w1", nameAr: "دهانات بلاستيك نصف لامع", nameEn: "Semi-Gloss Plastic Paints", img: `${ECO_BASE}/modern/Walls/PAINT.webp`, descAr: "قابلة للغسيل ومقاومة للبقع بألوان عصرية مختارة.", descEn: "Washable and stain-resistant in curated modern colors." },
            { id: "w2", nameAr: "حوائط ديكورية مع بانوهات بسيطة", nameEn: "Decorative Walls with Simple Moldings", img: `${ECO_BASE}/modern/Walls/ARTWORK.webp`, descAr: "لمسة أناقة تضيف عمقاً وتفاصيل ناعمة للجدار.", descEn: "An elegant touch adding depth and soft details to the wall." },
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Plumbing & Fixtures",
          options: [
            { id: "p1", nameAr: "أطقم خلاطات مودرن كروم", nameEn: "Modern Chrome Mixer Sets", img: `${ECO_BASE}/modern/plumbing/Mixer/1.webp`, descAr: "خلاطات بتصميم انسيابي مع قلب سيراميك لضمان عدم التسريب.", descEn: "Sleek mixers with ceramic cartridges to ensure zero leakage." },
            { id: "p2", nameAr: "أحواض وقواعد معلقة", nameEn: "Wall-Hung Basins & Toilets", img: `${ECO_BASE}/modern/plumbing/Toilet/1.webp`, descAr: "سهولة في التنظيف ومظهر راقٍ وموفر للمساحة.", descEn: "Easy cleaning, refined appearance, and space-saving." },
          ]
        }
      ]
    },
    {
      styleId: "neoclassic",
      styleNameAr: "نيوكلاسيك (Neoclassic)",
      styleNameEn: "Neoclassic",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب الداخلية",
          nameEn: "Internal Doors",
          options: [
            { id: "nd1", nameAr: "باب نيوكلاسيك مع حليات مدهبة", nameEn: "Neoclassic Door with Gilded Trims", img: `${ECO_BASE}/neoclassic/Doors/1.webp`, descAr: "يدمج بين فخامة الماضي وبساطة الحاضر بتفاصيل دقيقة.", descEn: "Combines past luxury with modern simplicity using subtle details." },
            { id: "nd2", nameAr: "باب أبيض مع بانوهات كلاسيكية", nameEn: "White Door with Classic Panels", img: `${ECO_BASE}/neoclassic/Doors/2.webp`, descAr: "إطارات بارزة تضفي رونقاً ملكياً هادئاً.", descEn: "Raised frames adding a calm royal splendor." },
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات",
          nameEn: "Flooring",
          options: [
            { id: "nf1", nameAr: "سيراميك نيوكلاسيك 120x60 فرز أول", nameEn: "Premium Neoclassic Ceramic 120x60", img: `${ECO_BASE}/neoclassic/Flooring/Ceramic/120 X 60 سيراميك.webp`, descAr: "عروق رخامية متألقة تمنح المكان فخامة استثنائية.", descEn: "Brilliant marble veins granting exceptional luxury." },
            { id: "nf2", nameAr: "سيراميك نيوكلاسيك 60x60 فرز أول", nameEn: "Premium Neoclassic Ceramic 60x60", img: `${ECO_BASE}/neoclassic/Flooring/Ceramic/60 X 60 سيراميك.webp`, descAr: "بلاط سيراميك فاخر بأبعاد متناسقة ومقاومة عالية للاهتراء.", descEn: "Premium ceramic tiles with symmetrical dimensions and high wear resistance." },
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف المعلقة (Gypsum Board)",
          nameEn: "Suspended Ceilings",
          options: [
            { id: "nc1", nameAr: "سقف نيوكلاسيك مع حليات جبسية راقية", nameEn: "Neoclassic Ceiling with Elegant Moldings", img: `${ECO_BASE}/neoclassic/Ceiling/1.webp`, descAr: "حواف وسقوف نيوكلاسيك مع زخارف ناعمة للإنارة المخفية.", descEn: "Neoclassic borders and ceilings with soft moldings for cove lighting." },
            { id: "nc2", nameAr: "سقف نيوكلاسيك فلات مجهز لنجفة", nameEn: "Flat Neoclassic Ceiling with Chandelier Base", img: `${ECO_BASE}/neoclassic/Ceiling/2.webp`, descAr: "سقف مستوٍ راقٍ ومثالي لتعليق النجف الكريستالي الفاخر.", descEn: "Elaborate flat ceiling perfectly ready for premium crystal chandeliers." }
          ]
        },
        {
          id: "walls",
          nameAr: "دهانات وتجليد الحوائط",
          nameEn: "Walls Paints & Cladding",
          options: [
            { id: "nw1", nameAr: "دهانات بألوان نيوكلاسيك هادئة", nameEn: "Quiet Neoclassic Tone Paints", img: `${ECO_BASE}/neoclassic/Walls/1.webp`, descAr: "درجات ألوان مختارة بعناية تعكس الفخامة الهادئة والعمق.", descEn: "Carefully curated paint tones reflecting calm luxury and visual depth." },
            { id: "nw2", nameAr: "بانوهات كلاسيكية أنيقة للحوائط", nameEn: "Elegant Classic Wall Moldings", img: `${ECO_BASE}/neoclassic/Walls/2.webp`, descAr: "إطارات حائط جبسية تضفي لمسة فنية وروح القصور الكلاسيكية.", descEn: "Gypsum wall panels adding an artistic touch and a classic palace vibe." }
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Plumbing & Fixtures",
          options: [
            { id: "np1", nameAr: "أطقم خلاطات نيوكلاسيك مذهبة", nameEn: "Neoclassic Gilded Mixer Sets", img: `${ECO_BASE}/neoclassic/plumbing/Mixer/1.webp`, descAr: "خلاطات مياه بتصميم نيوكلاسيك مطلي بلمعان ذهبي عالي المقاومة.", descEn: "Water mixers with neoclassic details and highly resistant gold plating." },
            { id: "np2", nameAr: "قاعدة وحوض كلاسيك تشطيب فاخر", nameEn: "Classic Toilet & Basin Premium Finish", img: `${ECO_BASE}/neoclassic/plumbing/Toilet/1.webp`, descAr: "تصاميم صحي تقليدية بلمسات كلاسيكية فاخرة وسهلة التنظيف.", descEn: "Traditional sanitary designs with luxurious classic touches, easy to clean." }
          ]
        }
      ]
    }
  ],
  medium: [
    {
      styleId: "modern",
      styleNameAr: "مودرن (Modern)",
      styleNameEn: "Modern",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب الداخلية",
          nameEn: "Internal Doors",
          options: [
            { id: "md1", nameAr: "باب مودرن مستورد مع مفصلات مخفية", nameEn: "Imported Modern Door with Concealed Hinges", img: `${MED_BASE}/modern/Doors/single/1.webp`, descAr: "مفصلات خفية بالكامل وإغلاق مغناطيسي ناعم.", descEn: "Fully concealed hinges and soft magnetic closing." },
            { id: "md2", nameAr: "باب قشرة جوز طبيعي", nameEn: "Natural Walnut Veneer Door", img: `${MED_BASE}/modern/Doors/single/2.webp`, descAr: "تجزيعات خشبية طبيعية خلابة بتشطيب فاخر.", descEn: "Stunning natural wood grains with a premium finish." },
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات (بورسلين وباركيه)",
          nameEn: "Flooring",
          options: [
            { id: "mf1", nameAr: "بورسلين إسباني 120x60", nameEn: "Spanish Porcelain 120x60", img: `${MED_BASE}/modern/Flooring/Porcelien/بورسلين.webp`, descAr: "قص ليزر دقيق بدون فواصل ظاهرة لجماليات لا تضاهى.", descEn: "Precise laser cut with invisible joints for unmatched aesthetics." },
            { id: "mf2", nameAr: "أرضيات HDF ألماني", nameEn: "German HDF Flooring", img: `${MED_BASE}/modern/Flooring/Ceramic/سيراميك شبيه الباركيه.webp`, descAr: "مقاومة للخدش والماء مع ملمس خشبي واقعي.", descEn: "Scratch and water-resistant with realistic wood texture." },
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف المعلقة (Gypsum Board)",
          nameEn: "Suspended Ceilings",
          options: [
            { id: "mc1", nameAr: "سقف مودرن مدمج ببيت نور", nameEn: "Modern Ceiling with Light Cove", img: `${MED_BASE}/modern/Ceiling/1.webp`, descAr: "سقف مستوٍ مع بيوت نور عصرية تمنح المكان إضاءة دافئة وجميلة.", descEn: "Flat ceiling with modern light coves giving the space a warm, beautiful glow." },
            { id: "mc2", nameAr: "سقف مع قنوات إضاءة مغناطيسية", nameEn: "Ceiling with Magnetic Lighting Channels", img: `${MED_BASE}/modern/Ceiling/2.webp`, descAr: "تصميم عصري يتيح توجيه وتحريك السبوتات داخل مسارات مغناطيسية سوداء.", descEn: "Modern layout allowing spot direction and adjustment within black magnetic tracks." }
          ]
        },
        {
          id: "walls",
          nameAr: "تجليد الحوائط والديكور",
          nameEn: "Walls Cladding & Decor",
          options: [
            { id: "mw1", nameAr: "تجليد بديل الخشب مع إضاءة ليد", nameEn: "Wood-Alternative Cladding with LED", img: `${MED_BASE}/modern/Walls/1.webp`, descAr: "شرائح طولية أنيقة مدمج بها خطوط إضاءة دافئة.", descEn: "Elegant vertical slats integrated with warm light strips." },
            { id: "mw2", nameAr: "تجليد بديل الرخام اللامع", nameEn: "Polished Marble-Alternative Cladding", img: `${MED_BASE}/modern/Walls/2.webp`, descAr: "ألواح عريضة تعطي انطباع الرخام الطبيعي بتكلفة ذكية.", descEn: "Wide slabs giving natural marble impression at smart cost." },
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Plumbing & Fixtures",
          options: [
            { id: "mp1", nameAr: "خلاطات مياه دفن فاخرة", nameEn: "Luxury Concealed Water Mixers", img: `${MED_BASE}/modern/plumbing/Mixer/1.webp`, descAr: "خلاطات مدمجة داخل الحائط (دفن) بتصميم إيطالي راقٍ وعمر طويل.", descEn: "Concealed (in-wall) water mixers with refined Italian design and longevity." },
            { id: "mp2", nameAr: "أطقم صحي معلقة ماركة عالمية", nameEn: "Premium Wall-Hung Sanitary Ware", img: `${MED_BASE}/modern/plumbing/Toilet/1.webp`, descAr: "أحواض وقواعد معلقة في الحائط مع خزان دفن معزول تماماً.", descEn: "Wall-mounted toilets and basins with fully insulated concealed cisterns." }
          ]
        }
      ]
    },
    {
      styleId: "classic",
      styleNameAr: "كلاسيك (Classic)",
      styleNameEn: "Classic",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب الكلاسيكية",
          nameEn: "Classic Doors",
          options: [
            { id: "mcd1", nameAr: "باب كلاسيك محفور يدوياً", nameEn: "Hand-Carved Classic Door", img: `${MED_BASE}/neoclassic/Doors/single/1.webp`, descAr: "زخارف نباتية وهندسية أصيلة تعكس الفخامة.", descEn: "Authentic floral and geometric motifs reflecting luxury." },
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات",
          nameEn: "Flooring",
          options: [
            { id: "mcf1", nameAr: "بورسلين كلاسيكي فاخر مقاس كبير", nameEn: "Premium Large Classic Porcelain", img: `${MED_BASE}/neoclassic/Flooring/Porcelien/بورسلين.webp`, descAr: "بورسلين كلاسيكي مصقول بعروق مذهبة لإعطاء شعور بالاتساع والملكية.", descEn: "Polished classic porcelain with gilded veins to evoke a royal, spacious feel." }
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف المعلقة (Gypsum Board)",
          nameEn: "Suspended Ceilings",
          options: [
            { id: "mcc1", nameAr: "سقف كلاسيكي مع كرانيش وزخارف يدوية", nameEn: "Classic Ceiling with Handcrafted Cornices", img: `${MED_BASE}/neoclassic/Ceiling/1.webp`, descAr: "كرانيش جبسية كلاسيكية ممتدة ونقوش يدوية غاية في الدقة والأناقة.", descEn: "Continuous classic gypsum cornices and extremely precise, elegant hand carvings." },
            { id: "mcc2", nameAr: "سقف كلاسيك مع إضاءة نجفة مركزية", nameEn: "Classic Ceiling with Chandelier Base", img: `${MED_BASE}/neoclassic/Ceiling/2.webp`, descAr: "بيت نور دائرى أو مستطيل مهيأ بالكامل لتركيب نجفة كلاسيكية ضخمة.", descEn: "Circular or rectangular ceiling cove fully ready for massive classic chandeliers." }
          ]
        },
        {
          id: "walls",
          nameAr: "تجليد الحوائط والديكور",
          nameEn: "Walls Cladding & Decor",
          options: [
            { id: "mcw1", nameAr: "حوائط ديكورية مزينة بورق جدران كلاسيكي", nameEn: "Decorative Walls with Classic Wallpaper", img: `${MED_BASE}/neoclassic/Walls/1.webp`, descAr: "ورق حائط نيوكلاسيك راقٍ بنقوش هادئة ومقاوم للرطوبة.", descEn: "Refined neoclassic wallpaper with calm patterns and moisture resistance." },
            { id: "mcw2", nameAr: "تجليد حوائط خشبي بتصميم ملكي", nameEn: "Royal Wooden Wall Cladding", img: `${MED_BASE}/neoclassic/Walls/2.webp`, descAr: "تجليد خشبي باللون الأبيض أو العاجي يعطي فخامة قصور فرساي الكلاسيكية.", descEn: "Wooden cladding in white or ivory tones echoing the luxury of Versailles palaces." }
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Plumbing & Fixtures",
          options: [
            { id: "mcp1", nameAr: "خلاطات كلاسيكية باللون البرونزي الفخم", nameEn: "Classic Bronze Luxurious Mixers", img: `${MED_BASE}/neoclassic/plumbing/Mixer/1.webp`, descAr: "أطقم خلاطات كلاسيكية باللون النحاسي/البرونزي العتيق تعبر عن التميز.", descEn: "Classic bronze/antique brass mixer sets conveying vintage excellence." },
            { id: "mcp2", nameAr: "طقم صحي كلاسيكي بتفاصيل ملكية", nameEn: "Classic Sanitary Set with Royal Details", img: `${MED_BASE}/neoclassic/plumbing/Toilet/1.webp`, descAr: "تصاميم كلاسيكية دائرية للأحواض والقواعد تتناسق مع الديكور الفخم.", descEn: "Circular classic configurations for toilets and basins blending with high-end decor." }
          ]
        }
      ]
    }
  ],
  luxury: [
    {
      styleId: "modern",
      styleNameAr: "مودرن فاخر (Luxury Modern)",
      styleNameEn: "Luxury Modern",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب المحورية والمخفية",
          nameEn: "Pivot & Concealed Doors",
          options: [
            { id: "ld1", nameAr: "باب محوري (Pivot Door) بارتفاع السقف", nameEn: "Full-Height Pivot Door", img: `${LUX_BASE}/modern/modern/Doors/single/1.webp`, descAr: "دوران سلس على محور مركزي لمدخل غاية في الإبهار.", descEn: "Smooth rotation on central pivot for an awe-inspiring entrance." },
            { id: "ld2", nameAr: "باب مخفي مدمج مع تجليد الحائط", nameEn: "Frameless Wall-Integrated Door", img: `${LUX_BASE}/modern/modern/Doors/single/2.webp`, descAr: "يختفي تماماً داخل التصميم العام للجدار دون إطارات.", descEn: "Completely disappears within the overall wall layout without frames." },
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات الفاخرة",
          nameEn: "Luxury Flooring",
          options: [
            { id: "lf1", nameAr: "رخام طبيعي مستورد (كرارا / إمبيرادور)", nameEn: "Imported Natural Marble", img: `${LUX_BASE}/modern/modern/Flooring/Marble/رخام.webp`, descAr: "ألواح رخام طبيعي مختارة بعناية فائقة مع جلي وتلميع ألماسي.", descEn: "Carefully curated natural marble slabs with diamond polishing." },
            { id: "lf2", nameAr: "باركيه خشب طبيعي مسمار", nameEn: "Solid Wood Parquet", img: `${LUX_BASE}/modern/modern/Flooring/Parquite/خشب باركيه.webp`, descAr: "عمر افتراضي طويل وعزل حراري وصوتي ممتاز.", descEn: "Long lifespan and superior thermal and acoustic insulation." },
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف المعلقة (Gypsum Board)",
          nameEn: "Suspended Ceilings",
          options: [
            { id: "lc1", nameAr: "سقف مودرن فاخر بتصميم هندسي", nameEn: "Luxury Geometric Modern Ceiling", img: `${LUX_BASE}/modern/modern/Ceiling/1.webp`, descAr: "سقف جبسي مستوٍ مع إضاءات ليد بروفايل مدمجة ومتقاطعة بتناسق مذهل.", descEn: "Flat gypsum ceiling with integrated cross-cutting LED profiles in perfect harmony." },
            { id: "lc2", nameAr: "سقف مودرن مدمج بفتحات تهوية وتكييف", nameEn: "Modern Ceiling with AC Slot Diffusers", img: `${LUX_BASE}/modern/modern/Ceiling/2.webp`, descAr: "سقف فاخر مجهز بالكامل لاستقبال التكييف الكونسيلد المخفي مع مخارج هواء أنيقة.", descEn: "Luxurious ceiling fully ready for concealed AC systems with elegant slot diffusers." }
          ]
        },
        {
          id: "walls",
          nameAr: "دهانات وتجليد الحوائط",
          nameEn: "Walls Cladding & Decor",
          options: [
            { id: "lw1", nameAr: "تجليد حوائط رخام طبيعي مفتوح العروق (Bookmatch)", nameEn: "Natural Bookmatch Marble Wall Cladding", img: `${LUX_BASE}/modern/modern/Walls/1.webp`, descAr: "ألواح رخام طبيعي ضخمة متقابلة العروق تعكس لوحة طبيعية ساحرة على الحائط.", descEn: "Massive natural marble slabs placed back-to-back, forming a stunning natural painting." },
            { id: "lw2", nameAr: "تجليد خشب طبيعي فاخر مع إضاءات مدمجة", nameEn: "Premium Wood Panel Cladding with Built-in Lights", img: `${LUX_BASE}/modern/modern/Walls/2.webp`, descAr: "تجليد جدران بخشب الجوز أو البلوط الطبيعي مع خطوط إنارة مخفية تعزز الفخامة.", descEn: "Wall cladding with natural walnut or oak panels paired with built-in ambient lighting." }
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Plumbing & Fixtures",
          options: [
            { id: "lp1", nameAr: "خلاطات مياه ماركة عالمية تشطيب ذهبي مطفي", nameEn: "Premium Matte Gold Concealed Mixers", img: `${LUX_BASE}/modern/modern/plumbing/Mixer/1.webp`, descAr: "خلاطات مياه دفن ماركة Grohe أو ما يعادلها بتشطيب ذهبي مطفي مقاوم للبصمات.", descEn: "Premium concealed Grohe or equivalent water mixers in fingerprint-resistant matte gold." },
            { id: "lp2", nameAr: "نظام دش مطري دفن مع نفاثات تدليك (Body Jets)", nameEn: "Concealed Rain Shower System with Body Jets", img: `${LUX_BASE}/modern/modern/plumbing/Mixer/jets.webp`, descAr: "نظام دش استحمام دفن متكامل يحتوي على رأس مطري ضخم ونفاثات جدارية للتدليك والاسترخاء.", descEn: "Complete concealed shower set featuring a massive rain head and relaxing wall massage jets." }
          ]
        },
        {
          id: "smart_home",
          nameAr: "الأنظمة الذكية (Smart Home)",
          nameEn: "Smart Home Systems",
          options: [
            { id: "ls1", nameAr: "تحكم كامل بالإضاءة والتكييف والستائر", nameEn: "Full Smart Automation", img: `${LUX_BASE}/modern/modern/style reference/1.webp`, descAr: "لوحات لمس ذكية وتطبيق هاتف للتحكم بكافة أرجاء المنزل.", descEn: "Smart touch panels and mobile app for automated home control." },
          ]
        }
      ]
    },
    {
      styleId: "classic",
      styleNameAr: "كلاسيكيات القصور (Palace Classic)",
      styleNameEn: "Palace Classic",
      sections: [
        {
          id: "doors",
          nameAr: "الأبواب الكلاسيكية الفاخرة",
          nameEn: "Palace Classic Doors",
          options: [
            { id: "lcd_door1", nameAr: "باب كلاسيكي مزدوج بحليات ذهبية للقاعات", nameEn: "Double Classic Door with Gilded Trims", img: `${LUX_BASE}/classic/traditional/Doors/Classic/douple/1.webp`, descAr: "أبواب مزدوجة خشبية ثقيلة ونقوش محفورة باليد مطلية بورق الذهب الفرنسي.", descEn: "Heavy double wooden doors with handcrafted carvings coated in fine French gold-leaf." }
          ]
        },
        {
          id: "flooring",
          nameAr: "الأرضيات الملكية",
          nameEn: "Palace Flooring",
          options: [
            { id: "lcd_floor1", nameAr: "أرضيات رخام كلاسيكية مستوردة مع جلي ألماسي", nameEn: "Imported Classic Marble Flooring", img: `${LUX_BASE}/classic/traditional/Flooring/Marble/رخام.webp`, descAr: "أرضيات رخام طبيعي بنقوش هندسية دقيقة (Waterjet) تليق بالصالونات الفخمة وقاعات الاستقبال.", descEn: "Natural marble tiles with intricate waterjet geometric patterns perfect for grand reception halls." }
          ]
        },
        {
          id: "ceiling",
          nameAr: "الأسقف الفرنسية الفاخرة",
          nameEn: "French Palace Ceilings",
          options: [
            { id: "lcd_ceiling1", nameAr: "أسقف فرنسية مع كرانيش وزخارف يدوية مذهبة", nameEn: "Gilded Handcrafted Palace Ceilings", img: `${LUX_BASE}/classic/traditional/Ceiling/3.webp`, descAr: "أسقف جبسية كلاسيكية مذهبة وكرانيش عريضة منفذة بدقة فنية متناهية.", descEn: "Classic gilded gypsum ceilings and wide, elaborate palace cornices executed by master sculptors." }
          ]
        },
        {
          id: "walls",
          nameAr: "الأعمال الفنية والزخارف",
          nameEn: "Artistic Ornaments",
          options: [
            { id: "lcd1", nameAr: "تجليد حوائط كلاسيكي مذهب بورق الذهب الفرنسي", nameEn: "French Gold-Leaf Palace Wall Moldings", img: `${LUX_BASE}/classic/traditional/Walls/1.webp`, descAr: "تشطيب حوائط وبانوهات جبسية وخشبية يدوية مطلية بالذهب على أيدي أمهر الفنانين والحرفيين.", descEn: "Handcrafted wall panels and gypsum moldings decorated with authentic gold leaf by master artisans." }
          ]
        },
        {
          id: "plumbing",
          nameAr: "تأسيس وتشطيب السباكة",
          nameEn: "Palace Plumbing & Fixtures",
          options: [
            { id: "lcd_plumbing1", nameAr: "خلاطات مياه كلاسيكية مطلية بالذهب عيار 24", nameEn: "24k Gold-Plated Classic Palace Mixers", img: `${LUX_BASE}/classic/traditional/plumbing/Mixer/1.webp`, descAr: "خلاطات مياه مستوردة بتصميم كلاسيكي ملكي مطلي بالذهب النقي المقاوم للخدش والحرارة.", descEn: "Imported royal classic water mixers plated with pure scratch and heat-resistant 24k gold." }
          ]
        }
      ]
    }
  ]
};
