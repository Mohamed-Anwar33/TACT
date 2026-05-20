import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Image, Layers, Lock, Palette, StickyNote, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { CatalogOption, CatalogPackage, CatalogStyle, getPackage, getPackageStyles, isPackageUnlocked } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SelectionItem = {
  id: string;
  option_id: string;
  media_id?: string;
  style_id: string;
  style: string;
  category_id: string;
  category: string;
  option_name: string;
  description?: string | null;
  image_url?: string | null;
  note: string;
  place: string;
  qty: string;
};

type SectionSelection = {
  style_id: string;
  style: string;
  category_id: string;
  category: string;
  notes: string;
  selected: Record<string, SelectionItem>;
};

type ImageTile = {
  id: string;
  option: CatalogOption;
  imageUrl?: string | null;
  mediaId?: string;
  label: string;
};

const emptySectionSelection = (style: CatalogStyle, categoryId: string, categoryName: string): SectionSelection => ({
  style_id: style.id,
  style: style.name_ar,
  category_id: categoryId,
  category: categoryName,
  notes: "",
  selected: {},
});

export default function Configurator() {
  const { id } = useParams();
  const packageId = id ?? "economy";
  const { lang } = useLang();
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [pkg, setPkg] = useState<CatalogPackage | null>(null);
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeStyleIdx, setActiveStyleIdx] = useState(0);
  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [showStylePreview, setShowStylePreview] = useState(true);
  const [selections, setSelections] = useState<Record<string, SectionSelection>>({});
  const [busy, setBusy] = useState(false);
  const wasLightboxOpen = useRef(false);

  // Zoom Lightbox States
  const [zoomTile, setZoomTile] = useState<ImageTile | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = () => {
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setZoomPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    setZoomPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - zoomPosition.x, y: touch.clientY - zoomPosition.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setZoomPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.25, 5));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setZoomPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleNextTile = () => {
    if (!zoomTile) return;
    const currentIndex = imageTiles.findIndex((t) => t.id === zoomTile.id);
    if (currentIndex !== -1 && currentIndex < imageTiles.length - 1) {
      setZoomTile(imageTiles[currentIndex + 1]);
      resetZoom();
    }
  };

  const handlePrevTile = () => {
    if (!zoomTile) return;
    const currentIndex = imageTiles.findIndex((t) => t.id === zoomTile.id);
    if (currentIndex > 0) {
      setZoomTile(imageTiles[currentIndex - 1]);
      resetZoom();
    }
  };

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user) return;
      setChecking(true);
      const [packageData, styleData, unlocked] = await Promise.all([
        getPackage(packageId),
        getPackageStyles(packageId),
        isPackageUnlocked(user.id, packageId, !!profile?.packages_unlocked),
      ]);
      if (!alive) return;
      setPkg(packageData);
      setStyles(styleData);
      setAllowed(unlocked);
      setChecking(false);
    }
    if (!loading && user) load();
    return () => {
      alive = false;
    };
  }, [packageId, user, loading, profile?.packages_unlocked]);

  // Browser back button: close lightbox instead of navigating away
  useEffect(() => {
    const isOpen = !!zoomTile;
    if (!isOpen) {
      wasLightboxOpen.current = false;
      return;
    }
    if (!wasLightboxOpen.current) {
      history.pushState({ lightbox: true }, '');
      wasLightboxOpen.current = true;
    }
    const handlePopState = () => {
      setZoomTile(null);
      setZoomScale(1);
      setZoomPosition({ x: 0, y: 0 });
      wasLightboxOpen.current = false;
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [zoomTile]);

  const activeStyle = styles[activeStyleIdx];
  const stylePreviewSection = activeStyle?.categories.find((category) => category.slug === "style-preview");
  const sections = activeStyle?.categories.filter((category) => category.slug !== "style-preview") ?? [];
  const activeSection = showStylePreview && stylePreviewSection ? stylePreviewSection : sections[activeSecIdx];
  const sectionKey = activeStyle && activeSection ? `${activeStyle.id}_${activeSection.id}` : "";
  const currentSectionSelection = sectionKey ? selections[sectionKey] : undefined;

  const imageTiles = useMemo<ImageTile[]>(() => {
    if (!activeSection) return [];
    return activeSection.options.flatMap((option) => {
      const mediaItems = option.media?.length
        ? option.media
        : option.image_url
          ? [{ id: `${option.id}-main`, url: option.image_url, alt_ar: option.name_ar, alt_en: option.name_en }]
          : [];
      return mediaItems.map((media, mediaIndex) => ({
        id: `${option.id}:${media.id ?? mediaIndex}`,
        option,
        imageUrl: media.url,
        mediaId: media.id,
        label: lang === "ar" ? media.alt_ar || option.name_ar : media.alt_en || option.name_en,
      }));
    });
  }, [activeSection, lang]);

  const selectedItems = useMemo(() => Object.values(selections).flatMap((section) => Object.values(section.selected ?? {})), [selections]);
  const selectedCount = selectedItems.length;

  const updateSection = (patch: Partial<SectionSelection>) => {
    if (!activeStyle || !activeSection) return;
    const key = `${activeStyle.id}_${activeSection.id}`;
    const categoryName = lang === "ar" ? activeSection.name_ar : activeSection.name_en;
    setSelections((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? emptySectionSelection(activeStyle, activeSection.id, categoryName)),
        ...patch,
      },
    }));
  };

  const toggleTile = (tile: ImageTile) => {
    if (!activeStyle || !activeSection) return;
    const key = `${activeStyle.id}_${activeSection.id}`;
    const categoryName = lang === "ar" ? activeSection.name_ar : activeSection.name_en;
    const optionName = lang === "ar" ? tile.option.name_ar : tile.option.name_en;
    setSelections((current) => {
      const section = current[key] ?? emptySectionSelection(activeStyle, activeSection.id, categoryName);
      const selected = { ...(section.selected ?? {}) };
      if (selected[tile.id]) {
        delete selected[tile.id];
      } else {
        selected[tile.id] = {
          id: tile.id,
          option_id: tile.option.id,
          media_id: tile.mediaId,
          style_id: activeStyle.id,
          style: lang === "ar" ? activeStyle.name_ar : activeStyle.name_en,
          category_id: activeSection.id,
          category: categoryName,
          option_name: optionName,
          description: lang === "ar" ? tile.option.description_ar : tile.option.description_en,
          image_url: tile.imageUrl,
          note: "",
          place: "",
          qty: "",
        };
      }
      return {
        ...current,
        [key]: {
          ...section,
          selected,
        },
      };
    });
  };

  const updateItemNote = (itemId: string, note: string) => {
    if (!currentSectionSelection) return;
    updateSection({
      selected: {
        ...currentSectionSelection.selected,
        [itemId]: {
          ...currentSectionSelection.selected[itemId],
          note,
        },
      },
    });
  };

  const updateItemField = (itemId: string, field: 'place' | 'qty', value: string) => {
    if (!currentSectionSelection) return;
    updateSection({
      selected: {
        ...currentSectionSelection.selected,
        [itemId]: {
          ...currentSectionSelection.selected[itemId],
          [field]: value,
        },
      },
    });
  };

  const removeItem = (item: SelectionItem) => {
    setSelections((current) => {
      const key = `${item.style_id}_${item.category_id}`;
      const section = current[key];
      if (!section) return current;
      const selected = { ...section.selected };
      delete selected[item.id];
      return { ...current, [key]: { ...section, selected } };
    });
  };

  const submit = async () => {
    if (!user) {
      nav("/auth");
      return;
    }
    if (!allowed) {
      toast.error(lang === "ar" ? "هذه الباقة غير مفعلة لحسابك" : "This package is not active for your account");
      return;
    }
    if (!selectedCount) {
      toast.error(lang === "ar" ? "اختر صورة واحدة على الأقل قبل الحفظ" : "Select at least one image before saving");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("configurator_selections").insert({
      user_id: user.id,
      package_id: packageId,
      selections: {
        version: 2,
        package_id: packageId,
        package_name: lang === "ar" ? pkg?.name_ar : pkg?.name_en,
        sections: selections,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "ar" ? "تم حفظ اختياراتك وملاحظاتك بنجاح" : "Selections saved successfully");
    setTimeout(() => nav("/customer"), 1400);
  };

  if (loading || checking) {
    return <div className="pt-40 pb-20 text-center container-luxe text-muted-foreground">...</div>;
  }

  if (!allowed) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-teal-deep text-ivory flex items-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-2xl text-center">
          <Lock className="mx-auto text-gold mb-6" size={46} />
          <SectionEyebrow label={lang === "ar" ? "الباقة غير مفعلة" : "Package locked"} />
          <h1 className="display-2 mt-4">{lang === "ar" ? "هذه الباقة لم تفتح لحسابك بعد" : "This package is not unlocked yet"}</h1>
          <p className="text-ivory/70 mt-5">{lang === "ar" ? "سجل بيانات العربون للباقة المطلوبة وانتظر اعتماد الإدارة." : "Submit the deposit details for this package and wait for admin approval."}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/payment" className="btn-gold">{lang === "ar" ? "تسجيل الدفع" : "Submit Payment"}</Link>
            <Link to="/packages" className="btn-ghost-light">{lang === "ar" ? "باقاتي" : "My Packages"}</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!pkg || !activeStyle || !activeSection) {
    return (
      <div className="pt-40 pb-20 text-center container-luxe">
        <h2 className="text-xl text-muted-foreground">{lang === "ar" ? "لا توجد اختيارات متاحة لهذه الباقة حاليًا" : "No options are available for this package yet"}</h2>
      </div>
    );
  }

  const activeSectionName = lang === "ar" ? activeSection.name_ar : activeSection.name_en;

  return (
    <>
      <section className="pt-36 pb-12 bg-teal-deep text-ivory relative overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <SectionEyebrow label={lang === "ar" ? "تخصيص الباقة" : "Package Configurator"} />
          <div className="mt-5 grid lg:grid-cols-[1fr_280px] gap-8 items-end">
            <div>
              <h1 className="display-2">{lang === "ar" ? pkg.name_ar : pkg.name_en}</h1>
              <p className="text-ivory/78 mt-3 max-w-2xl text-sm leading-relaxed">
                {lang === "ar"
                  ? "اختار الستايل، ثم افتح كل تصنيف وحدد الصور التي تعجبك. كل صورة تختارها يمكن إضافة ملاحظة خاصة بها لتظهر في تقرير التنفيذ."
                  : "Choose a style, browse each category, and select the images you like. Every selected image can carry its own note in the execution report."}
              </p>
            </div>
            <div className="rounded-2xl border border-gold/30 bg-[#0A2E30]/40 backdrop-blur-md p-6 flex items-center justify-between shadow-lg relative overflow-hidden group min-h-[110px]">
              {/* Subtle background golden aura */}
              <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-gold/10 blur-xl group-hover:bg-gold/15 transition-all duration-500" />
              
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold font-extrabold block mb-1">
                  {lang === "ar" ? "إجمالي الاختيارات" : "TOTAL SELECTIONS"}
                </span>
                <div className="text-xs text-ivory/70 font-serif-ar">{lang === "ar" ? "الصور المضافة للتقرير" : "Selected images in report"}</div>
              </div>
              
              <div className="text-end z-10">
                <div className="text-5xl font-serif text-gold font-black tracking-tight drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]">
                  {selectedCount}
                </div>
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">
                  {lang === "ar" ? "صورة مختارة" : "Images selected"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {styles.map((style, idx) => {
              const isActive = activeStyleIdx === idx;
              const styleCategoriesCount = style.categories.filter((category) => category.slug !== "style-preview").length;
              const previewCat = style.categories.find(c => c.slug === "style-preview");
              const coverUrl = previewCat?.options?.[0]?.media?.[0]?.url || previewCat?.options?.[0]?.image_url || null;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    setActiveStyleIdx(idx);
                    setActiveSecIdx(0);
                    setShowStylePreview(true);
                    window.scrollTo({ top: 260, behavior: "smooth" });
                  }}
                  className={cn(
                    "group text-start rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[260px] overflow-hidden border",
                    isActive 
                      ? "bg-gradient-to-br from-[#0F3D42] to-[#0A2629] border-gold shadow-[0_15px_40px_rgba(212,175,55,0.18)] ring-1 ring-gold/40" 
                      : "bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-lg hover:shadow-black/20"
                  )}
                >
                  {/* Cover Image Background */}
                  {coverUrl && (
                    <>
                      <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" />
                      <div className={cn(
                        "absolute inset-0 transition-all duration-500",
                        isActive 
                          ? "bg-gradient-to-t from-[#0A2629]/95 via-[#0A2629]/70 to-[#0A2629]/40" 
                          : "bg-gradient-to-t from-[#0A2629]/95 via-[#0A2629]/75 to-[#0A2629]/50 group-hover:from-[#0A2629]/90 group-hover:via-[#0A2629]/60 group-hover:to-[#0A2629]/30"
                      )} />
                    </>
                  )}
                  {/* Decorative Abstract Background Elements */}
                  <div className={cn(
                    "absolute -right-16 -bottom-16 w-36 h-36 rounded-full transition-all duration-700 blur-[40px] pointer-events-none",
                    isActive ? "bg-gold/15" : "bg-white/5 group-hover:bg-gold/10"
                  )} />
                  <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Header: Category count & Active state */}
                  <div className="flex items-center justify-between w-full relative z-10">
                    <span className={cn(
                      "text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-sm transition-all duration-300",
                      isActive 
                        ? "bg-gold/15 text-gold border-gold/30" 
                        : "bg-white/5 text-ivory/60 border-white/10 group-hover:text-gold/80 group-hover:border-gold/20"
                    )}>
                      {styleCategoriesCount} {lang === "ar" ? "تصنيف متاح" : "Categories"}
                    </span>
                    
                    {isActive && (
                      <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 tracking-wider">
                        {lang === "ar" ? "نشط" : "ACTIVE"}
                      </span>
                    )}
                  </div>

                  {/* Body: Style Names */}
                  <div className="mt-6 relative z-10">
                    <div className={cn(
                      "h-0.5 rounded-full bg-gold transition-all duration-500 mb-3",
                      isActive ? "w-12" : "w-6 group-hover:w-12"
                    )} />
                    
                    <h3 className="font-serif-ar text-2xl text-white font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gold">
                      {lang === "ar" ? style.name_ar : style.name_en}
                    </h3>
                    
                    <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {lang === "ar" 
                        ? `تخصيص بنود وتفاصيل الديكور لستايل ${style.name_ar}.` 
                        : `Customize details & components of ${style.name_en} style.`
                      }
                    </p>
                  </div>

                  {/* Footer Action text */}
                  <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs relative z-10">
                    <span className={cn(
                      "font-bold transition-all duration-300", 
                      isActive ? "text-gold tracking-wide" : "text-white/40 group-hover:text-white/80"
                    )}>
                      {isActive 
                        ? (lang === "ar" ? "تم تحديد هذا الستايل" : "Selected Style") 
                        : (lang === "ar" ? "اضغط لاختيار هذا الستايل" : "Click to select")
                      }
                    </span>
                    <span className={cn(
                      "transition-all duration-300 transform",
                      isActive ? "text-gold translate-x-[-4px]" : "text-white/40 group-hover:text-gold group-hover:translate-x-[-4px]"
                    )}>
                      {lang === "ar" ? "←" : "→"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#f8f5ee]" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className={cn("container-luxe grid gap-8", showStylePreview ? "lg:grid-cols-1" : "lg:grid-cols-[290px_1fr]")}>
          {!showStylePreview && (
          <aside className="lg:sticky lg:top-28 lg:self-start bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-secondary mb-4">
              <Layers size={14} />
              <span>{lang === "ar" ? "التصنيفات" : "Categories"}</span>
            </div>
            <div className="space-y-1.5 max-h-[56vh] overflow-auto pe-1">
              {sections.map((section, idx) => {
                const key = `${activeStyle.id}_${section.id}`;
                const count = Object.keys(selections[key]?.selected ?? {}).length;
                const isActive = activeSecIdx === idx;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setShowStylePreview(false);
                      setActiveSecIdx(idx);
                    }}
                    className={cn(
                      "w-full text-start px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between",
                      !showStylePreview && isActive ? "bg-teal-soft/50 text-teal-deep font-bold border-s-4 border-gold" : "text-muted-foreground hover:bg-muted/70 hover:text-primary"
                    )}
                  >
                    <span className="truncate">{lang === "ar" ? section.name_ar : section.name_en}</span>
                    {count > 0 && <span className="min-w-6 h-6 rounded-full bg-gold/20 text-gold grid place-items-center text-xs font-bold">{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <button disabled={busy || !selectedCount} onClick={submit} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">
                <Check size={16} />
                <span>{busy ? "..." : lang === "ar" ? "حفظ وإرسال الاختيارات" : "Save Selections"}</span>
              </button>
            </div>
          </aside>
          )}

          <div className="space-y-8">
            <header className="bg-white border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase text-gold">{lang === "ar" ? activeStyle.name_ar : activeStyle.name_en}</div>
                <h2 className="font-serif-ar text-3xl text-teal-deep mt-1">{activeSectionName}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {showStylePreview
                    ? lang === "ar"
                      ? "اتفرج على صور الموديل الأول، واختار الصور التي تعبر عن الذوق المطلوب واكتب ملاحظتك عليها."
                      : "Review the style references first, select the images you like, and add notes."
                    : lang === "ar"
                      ? "اختار صورة أو أكثر، واضغط على الصورة مرة أخرى لإلغاء الاختيار."
                      : "Select one or more images; click again to unselect."}
                </p>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-mono self-start md:self-auto">
                {imageTiles.length} {lang === "ar" ? "صورة" : "images"}
              </span>
            </header>

            <div className={cn("grid gap-5", showStylePreview ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {imageTiles.map((tile, tileIndex) => {
                const item = currentSectionSelection?.selected?.[tile.id];
                const isSelected = !!item;
                return (
                  <article
                    key={tile.id}
                    className={cn(
                      "group bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-300",
                      isSelected ? "border-gold ring-2 ring-gold/20 shadow-lg" : "border-border hover:border-gold/60 hover:shadow-md"
                    )}
                  >
                    <button type="button" onClick={() => toggleTile(tile)} className="block w-full text-start">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {tile.imageUrl ? (
                          <img
                            src={tile.imageUrl}
                            alt={tile.label}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain image-crisp bg-white/5"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground"><Image size={28} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <span className="absolute top-3 start-3 bg-black/45 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/10">
                          {String(tileIndex + 1).padStart(2, "0")}
                        </span>
                        <span className={cn("absolute top-3 end-3 w-9 h-9 rounded-full border grid place-items-center transition-all", isSelected ? "bg-gold border-gold text-teal-deep" : "bg-black/35 border-white/25 text-white")}>
                          <Check size={18} />
                        </span>
                        
                        {/* Hover Zoom Overlay (Desktop) */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-gold/90 text-brand-dark flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <ZoomIn size={18} className="stroke-[2.5]" />
                          </div>
                        </div>

                        <div className="absolute bottom-3 start-3 end-12 text-white">
                          <h4 className="font-serif-ar text-base drop-shadow line-clamp-2">{lang === "ar" ? tile.option.name_ar : tile.option.name_en}</h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomTile(tile);
                            resetZoom();
                          }}
                          className="absolute bottom-3 end-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white hover:bg-gold hover:text-brand-dark hover:scale-110 flex items-center justify-center transition-all duration-300 z-10"
                          title={lang === "ar" ? "تكبير واستعراض التفاصيل" : "Zoom & Details"}
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                    </button>
                    {isSelected && item && (
                      <div className="p-4 border-t border-gold/25 bg-gold/5 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">{lang === "ar" ? "مكان الاستخدام" : "Usage Location"}</label>
                            <Input
                              value={item.place}
                              onChange={(e) => updateItemField(tile.id, 'place', e.target.value)}
                              className="h-9 bg-white text-xs"
                              placeholder={lang === "ar" ? "مثلاً: الصالون" : "e.g. Living room"}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">{lang === "ar" ? "الكمية التقديرية" : "Est. Qty"}</label>
                            <Input
                              value={item.qty}
                              onChange={(e) => updateItemField(tile.id, 'qty', e.target.value)}
                              className="h-9 bg-white text-xs"
                              placeholder={lang === "ar" ? "مثلاً: 20 م²" : "e.g. 20 m²"}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-teal-deep flex items-center gap-1.5 mb-2">
                            <StickyNote size={14} className="text-gold" />
                            <span>{lang === "ar" ? "ملاحظتك على الصورة" : "Image note"}</span>
                          </label>
                          <Textarea
                            value={item.note}
                            onChange={(e) => updateItemNote(tile.id, e.target.value)}
                            placeholder={lang === "ar" ? "مثلاً: عاجبني اللون، عايز نفس الفكرة في الحمام الرئيسي..." : "What do you like about this image?"}
                            className="min-h-20 resize-none bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {!showStylePreview && (
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-xs uppercase tracking-[0.2em] text-teal-deep font-bold mb-4">
                {lang === "ar" ? "ملاحظات عامة على التصنيف" : "General Category Notes"}
              </h3>
              <Textarea
                value={currentSectionSelection?.notes ?? ""}
                onChange={(e) => updateSection({ notes: e.target.value })}
                className="min-h-20 bg-background resize-none"
                placeholder={lang === "ar" ? "أي ملاحظات عامة على هذا التصنيف..." : "Any general notes for this category..."}
              />
            </div>
            )}

            {selectedCount > 0 && (
              <div className="bg-teal-deep text-ivory rounded-2xl border border-gold/25 p-6">
                <h3 className="font-serif-ar text-2xl mb-4">{lang === "ar" ? "ملخص الصور المختارة" : "Selected Summary"}</h3>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl bg-white/8 border border-white/10 p-2 relative group/item">
                      {item.image_url && <img src={item.image_url} alt={item.option_name} className="w-16 h-16 rounded-lg object-cover" />}
                      <div className="min-w-0 text-sm flex-1">
                        <span className="inline-block text-[9px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded mb-0.5">{item.style}</span>
                        <div className="text-gold/70 text-xs truncate">{item.category}</div>
                        <div className="font-bold truncate">{item.option_name}</div>
                        {item.note && <div className="text-ivory/65 text-xs line-clamp-2 mt-1">{item.note}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                        title={lang === "ar" ? "إزالة" : "Remove"}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={cn("flex items-center pt-4 border-t border-border", showStylePreview ? "justify-end" : "justify-between")}>
              {!showStylePreview && (
                <button disabled={activeSecIdx === 0} onClick={() => setActiveSecIdx((current) => current - 1)} className="btn-ghost-light !text-teal-deep !border-teal-deep/30 disabled:opacity-30 flex items-center gap-1.5">
                  {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  <span>{lang === "ar" ? "التصنيف السابق" : "Previous"}</span>
                </button>
              )}
              {showStylePreview ? (
                <button onClick={() => { setShowStylePreview(false); setActiveSecIdx(0); window.scrollTo({ top: 420, behavior: "smooth" }); }} className="btn-gold flex items-center gap-1.5 px-8 py-4 text-sm">
                  <span>{lang === "ar" ? "التالي: اختيارات البنود" : "Next: item choices"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : activeSecIdx < sections.length - 1 ? (
                <button onClick={() => { window.scrollTo({ top: 420, behavior: "smooth" }); setActiveSecIdx((current) => current + 1); }} className="btn-gold flex items-center gap-1.5 px-6">
                  <span>{lang === "ar" ? "التصنيف التالي" : "Next Category"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <button onClick={submit} disabled={busy || !selectedCount} className="btn-gold flex items-center gap-2 px-8 disabled:opacity-50">
                  <Check size={16} />
                  <span>{lang === "ar" ? "إنهاء وحفظ التقرير" : "Finish & Save Report"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox / Zoom Dialog Modal */}
      {zoomTile && (
        <div 
          className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl transition-opacity duration-300 overflow-y-auto"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {/* Top Header Bar */}
          <div className="sticky top-0 bg-black/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/10 z-20">
            <div>
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.2em] block mb-1">
                {lang === "ar" ? "معاينة التفاصيل الدقيقة والخامات" : "FINE DETAIL & MATERIAL INSPECTION"}
              </span>
              <h2 className="font-serif-ar text-base md:text-2xl text-white font-bold drop-shadow">
                {lang === "ar" ? zoomTile.option.name_ar : zoomTile.option.name_en}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Selection State Indicator / Toggle */}
              {activeStyle && activeSection && (
                <button
                  onClick={() => toggleTile(zoomTile)}
                  className={cn(
                    "px-4 md:px-5 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 border shadow-lg cursor-pointer",
                    selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id]
                      ? "bg-gold border-gold text-[#0C363A] hover:bg-white hover:border-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  )}
                >
                  <Check size={13} className="stroke-[3]" />
                  <span>
                    {selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id]
                      ? (lang === "ar" ? "محدد ومختار" : "SELECTED CHOICE")
                      : (lang === "ar" ? "تحديد هذا الخيار" : "SELECT OPTION")
                    }
                  </span>
                </button>
              )}

              <button
                onClick={() => setZoomTile(null)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-300 border border-white/10 cursor-pointer"
                title={lang === "ar" ? "إغلاق" : "Close"}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
            
            {/* Image Frame Card Container */}
            <div 
              className="relative w-full aspect-video md:aspect-[16/10] max-h-[55vh] min-h-[260px] bg-black/45 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center select-none cursor-zoom-in"
              style={{ cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              {/* Nav Arrows inside image frame container */}
              {imageTiles.findIndex((t) => t.id === zoomTile.id) > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevTile(); }}
                  className={cn(
                    "absolute z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/60 border border-white/15 text-white hover:bg-gold hover:text-[#0C363A] hover:border-gold flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer top-1/2 -translate-y-1/2",
                    lang === "ar" ? "right-3 md:right-4" : "left-3 md:left-4"
                  )}
                  title={lang === "ar" ? "الصورة السابقة" : "Previous Image"}
                >
                  {lang === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              )}

              {imageTiles.findIndex((t) => t.id === zoomTile.id) < imageTiles.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextTile(); }}
                  className={cn(
                    "absolute z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/60 border border-white/15 text-white hover:bg-gold hover:text-[#0C363A] hover:border-gold flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer top-1/2 -translate-y-1/2",
                    lang === "ar" ? "left-3 md:left-4" : "right-3 md:right-4"
                  )}
                  title={lang === "ar" ? "الصورة التالية" : "Next Image"}
                >
                  {lang === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              )}

              {/* Magnifiable image wrapper */}
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${zoomPosition.x}px, ${zoomPosition.y}px) scale(${zoomScale})`,
                  transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                }}
              >
                {zoomTile.imageUrl ? (
                  <img
                    src={zoomTile.imageUrl}
                    alt={zoomTile.label}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10 text-white/50">
                    <Image size={48} className="mb-4" />
                    <span>{lang === "ar" ? "لا توجد صورة متوفرة" : "No image available"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Control Bar and Note Section directly below the image frame */}
            <div className="w-full flex flex-col gap-5 items-center">
              
              {/* Zoom Pill and Image Index Counter */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl">
                
                {/* Index and Label info */}
                <div className="text-center sm:text-start">
                  <span className="text-[9px] md:text-[10px] text-gold uppercase tracking-wider block font-bold">
                    {lang === "ar" ? "خيار التصميم الحالي" : "CURRENT DESIGN OPTION"}
                  </span>
                  <span className="text-white/60 text-xs font-mono">
                    {lang === "ar" ? "صورة" : "Image"} {imageTiles.findIndex((t) => t.id === zoomTile.id) + 1} {lang === "ar" ? "من" : "of"} {imageTiles.length}
                  </span>
                </div>

                {/* Zoom Pill */}
                <div className="bg-white/10 border border-white/15 px-4 py-1.5 rounded-full flex items-center gap-3 md:gap-4 shadow-lg">
                  <button 
                    onClick={zoomOut}
                    disabled={zoomScale <= 1}
                    className="text-white hover:text-gold disabled:opacity-30 disabled:hover:text-white transition-colors cursor-pointer"
                    title={lang === "ar" ? "تصغير" : "Zoom Out"}
                  >
                    <ZoomOut size={15} />
                  </button>

                  <span className="text-white text-xs font-mono font-bold w-12 text-center select-none">
                    {Math.round(zoomScale * 100)}%
                  </span>

                  <button 
                    onClick={zoomIn}
                    disabled={zoomScale >= 5}
                    className="text-white hover:text-gold disabled:opacity-30 disabled:hover:text-white transition-colors cursor-pointer"
                    title={lang === "ar" ? "تكبير" : "Zoom In"}
                  >
                    <ZoomIn size={15} />
                  </button>

                  <div className="w-px h-3 bg-white/20" />

                  <button 
                    onClick={resetZoom}
                    className="text-white hover:text-gold transition-colors cursor-pointer"
                    title={lang === "ar" ? "إعادة الضبط" : "Reset Zoom"}
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

              {/* Selection Toggle and Notes Input Card */}
              {activeStyle && activeSection && (
                <div className="w-full bg-[#0A2E30]/65 border border-gold/25 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                  {/* Subtle background golden aura */}
                  <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-gold/5 blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-sm font-serif-ar text-white font-bold">
                        {lang === "ar" ? "حالة الاختيار لهذا البند" : "Selection state for this item"}
                      </h3>
                      <p className="text-[11px] text-white/50 mt-1">
                        {lang === "ar" 
                          ? "يمكنك تضمين هذا البند في تقرير التشطيبات الخاص بك وكتابة ملاحظات تفصيلية للمهندسين."
                          : "Include this item in your finishes report and write specific notes for the engineers."
                        }
                      </p>
                    </div>

                    <button
                      onClick={() => toggleTile(zoomTile)}
                      className={cn(
                        "px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 border shadow-lg cursor-pointer self-start sm:self-auto",
                        selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id]
                          ? "bg-gold border-gold text-[#0C363A] hover:bg-white hover:border-white"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      )}
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>
                        {selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id]
                          ? (lang === "ar" ? "محدد ومختار" : "SELECTED CHOICE")
                          : (lang === "ar" ? "تحديد هذا الخيار" : "SELECT OPTION")
                        }
                      </span>
                    </button>
                  </div>

                  {/* Notes Textarea (Only visible if item is selected) */}
                  {selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id] ? (
                    <div className="space-y-2 mt-1">
                      <label className="text-xs font-bold text-gold flex items-center gap-1.5">
                        <StickyNote size={14} />
                        <span>{lang === "ar" ? "ملاحظتك على الصورة" : "Image note"}</span>
                      </label>
                      <Textarea
                        value={selections[`${activeStyle.id}_${activeSection.id}`]?.selected?.[zoomTile.id]?.note ?? ""}
                        onChange={(e) => updateItemNote(zoomTile.id, e.target.value)}
                        placeholder={lang === "ar" ? "مثلاً: عاجبني اللون، عايز نفس الفكرة في الحمام الرئيسي..." : "What do you like about this image?"}
                        className="min-h-[100px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/30 backdrop-blur-md focus:border-gold/50 focus:ring-1 focus:ring-gold/50 rounded-xl select-text text-sm"
                      />
                      <span className="text-[10px] text-white/40 block mt-1">
                        {lang === "ar" 
                          ? "ملاحظتك سيتم حفظها تلقائياً وتظهر للمهندس عند تصميم وتنفيذ منزلك."
                          : "Your note will be saved automatically and shown to the engineer during implementation."
                        }
                      </span>
                    </div>
                  ) : (
                    <div className="py-5 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-xl">
                      {lang === "ar" 
                        ? "قم بتحديد الخيار لتتمكن من كتابة ملاحظاتك وتعديلاتها الخاصة."
                        : "Select this option to write custom notes and requests."
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Hint text at bottom of scrollable area */}
              <span className="text-[11px] text-white/30 tracking-wider text-center select-none max-w-md pb-8">
                {lang === "ar" 
                  ? "اسحب الصورة للتحريك عند التكبير • استخدم عجلة الماوس للتحكم بالزوم • أغلق بالضغط على X في الأعلى أو بالعودة للخلف"
                  : "Drag to pan when zoomed in • Scroll mouse wheel to zoom • Close by clicking X on top or pressing back button"
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
