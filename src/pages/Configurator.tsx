import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Image, Layers, Lock, Palette, StickyNote, ZoomIn, ZoomOut, RotateCcw, X, Upload, ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { CatalogOption, CatalogPackage, CatalogStyle, getPackage, getPackageStyles, isPackageUnlocked, sortPackageCategories, getPackageCategoryWeight } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import HoverPreview from "@/components/ui-luxe/HoverPreview";
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
  category_slug?: string;
  sort_order?: number;
  is_style_preview?: boolean;
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

type QuestionnaireSnapshot = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

const emptySectionSelection = (style: CatalogStyle, category: CatalogStyle["categories"][number], categoryName: string): SectionSelection => ({
  style_id: style.id,
  style: style.name_ar,
  category_id: category.id,
  category: categoryName,
  category_slug: category.slug,
  sort_order: category.sort_order,
  is_style_preview: category.slug === "style-preview",
  notes: "",
  selected: {},
});

export default function Configurator() {
  const { id } = useParams();
  const packageId = id ?? "economy";
  const { lang } = useLang();
  const { user, profile, isAdmin, isOfficeConsultant, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [pkg, setPkg] = useState<CatalogPackage | null>(null);
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeStyleIdx, setActiveStyleIdx] = useState(0);
  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [showStylePreview, setShowStylePreview] = useState(true);
  const [selections, setSelections] = useState<Record<string, SectionSelection>>({});
  const [busy, setBusy] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [customUploads, setCustomUploads] = useState<SelectionItem[]>([]);
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const [linkedQuestionnaire, setLinkedQuestionnaire] = useState<QuestionnaireSnapshot | null>(null);

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "ar" ? "يرجى رفع ملف صورة فقط" : "Please upload an image file only");
      return;
    }

    setUploadingCustom(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
      const owner = user?.id ?? "guest";
      const path = `questionnaires/custom-selections/${owner}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      
      const { error } = await supabase.storage
        .from("tact-media")
        .upload(path, file, { contentType: file.type, upsert: false });
        
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from("tact-media").getPublicUrl(path);
      const imageUrl = publicData.publicUrl;

      const newItem: SelectionItem = {
        id: `custom_${Date.now()}`,
        option_id: "custom_upload",
        style_id: "custom_uploads",
        style: lang === "ar" ? "خارج الكتالوج" : "Out of Catalog",
        category_id: "custom_category",
        category: lang === "ar" ? "صور خارجية مخصصة" : "Custom Uploads",
        option_name: lang === "ar" ? `صورة خارجية مرفوعة` : `Uploaded Image`,
        description: lang === "ar" ? "صورة خارجية مرفوعة من العميل للتوضيح والمطابقة." : "External image uploaded by client for matching/reference.",
        image_url: imageUrl,
        note: "",
        place: "",
        qty: "",
      };

      setCustomUploads((prev) => [...prev, newItem]);
      toast.success(lang === "ar" ? "تم رفع الصورة المخصصة بنجاح" : "Custom image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "فشل رفع الصورة" : "Image upload failed"));
    } finally {
      setUploadingCustom(false);
    }
  };

  const removeCustomUpload = (id: string) => {
    setCustomUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCustomUploadField = (id: string, field: 'note' | 'place' | 'qty', value: string) => {
    setCustomUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const wasLightboxOpen = useRef(false);
  const lightboxScrollRef = useRef<HTMLDivElement>(null);

  // Zoom Lightbox States
  const [searchParams, setSearchParams] = useSearchParams();
  const questionnaireId = searchParams.get("questionnaireId");
  const isOfficeSession = isOfficeConsultant && !!questionnaireId;
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHoverPreview, setActiveHoverPreview] = useState<{ url: string; label: string } | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const activeStyle = styles[activeStyleIdx];
  const stylePreviewSection = activeStyle?.categories.find((category) => category.slug === "style-preview");
  const sections = activeStyle ? sortPackageCategories(activeStyle.categories.filter((category) => category.slug !== "style-preview")) : [];
  const activeSection = showStylePreview && stylePreviewSection ? stylePreviewSection : sections[activeSecIdx];
  const sectionKey = activeStyle && activeSection ? `${activeStyle.id}_${activeSection.id}` : "";
  const currentSectionSelection = sectionKey ? selections[sectionKey] : undefined;

  // Reset page when category or style changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeSecIdx, activeStyleIdx]);

  const scrollToContentSection = () => {
    const element = document.getElementById("configurator-content-section");
    if (element) {
      const headerOffset = 90;
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      if (window.scrollY > elementTop) {
        window.scrollTo({ top: elementTop, behavior: "smooth" });
      }
    }
  };

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

  const ITEMS_PER_PAGE = 15;
  const paginatedTiles = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return imageTiles.slice(start, start + ITEMS_PER_PAGE);
  }, [imageTiles, currentPage]);
  const pageCount = Math.ceil(imageTiles.length / ITEMS_PER_PAGE);

  const zoomParam = searchParams.get("zoom");
  const zoomTile = useMemo(() => {
    if (!zoomParam) return null;
    const found = imageTiles.find((t) => t.id === zoomParam);
    if (found) return found;
    if (zoomParam.startsWith("style-cover-")) {
      const styleId = zoomParam.replace("style-cover-", "");
      const matchedStyle = styles.find((s) => s.id === styleId);
      if (matchedStyle) {
        const previewCat = matchedStyle.categories.find((c) => c.slug === "style-preview");
        const coverUrl = previewCat?.options?.[0]?.media?.[0]?.url || previewCat?.options?.[0]?.image_url || null;
        return {
          id: zoomParam,
          option: previewCat?.options?.[0] || ({ id: `style-opt-${matchedStyle.id}`, name_ar: matchedStyle.name_ar, name_en: matchedStyle.name_en, sort_order: 0 } as CatalogOption),
          imageUrl: coverUrl,
          label: lang === "ar" ? `${matchedStyle.name_ar} - التصميم المقترح` : `${matchedStyle.name_en} - Visual Style`
        } as ImageTile;
      }
    }
    return null;
  }, [zoomParam, imageTiles, styles, lang]);

  // Auto-sync page index with the zoomed tile if it's not on the current page
  useEffect(() => {
    if (zoomTile) {
      const idx = imageTiles.findIndex((t) => t.id === zoomTile.id);
      if (idx !== -1) {
        const page = Math.floor(idx / ITEMS_PER_PAGE);
        if (page !== currentPage) {
          setCurrentPage(page);
        }
      }
    }
  }, [zoomTile, imageTiles]);

  const setZoomTile = (tile: ImageTile | null) => {
    const next = new URLSearchParams(searchParams);
    if (tile) {
      next.set("zoom", tile.id);
    } else {
      next.delete("zoom");
    }
    setSearchParams(next);
  };

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
      const nextTile = imageTiles[currentIndex + 1];
      const next = new URLSearchParams(searchParams);
      next.set("zoom", nextTile.id);
      setSearchParams(next, { replace: true });
      resetZoom();
    }
  };

  const handlePrevTile = () => {
    if (!zoomTile) return;
    const currentIndex = imageTiles.findIndex((t) => t.id === zoomTile.id);
    if (currentIndex > 0) {
      const prevTile = imageTiles[currentIndex - 1];
      const next = new URLSearchParams(searchParams);
      next.set("zoom", prevTile.id);
      setSearchParams(next, { replace: true });
      resetZoom();
    }
  };

  const closeLightbox = () => {
    if (window.history.state && window.history.state.idx > 0) {
      nav(-1);
    } else {
      setZoomTile(null);
    }
    resetZoom();
    setIsDragging(false);
  };

  const saveLightboxNote = () => {
    closeLightbox();
    window.setTimeout(() => {
      document.getElementById("package-image-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  // Load draft selections from localStorage
  useEffect(() => {
    if (checking || !pkg) return;
    const key = `tact_configurator_draft_${packageId}_${questionnaireId || "client"}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { selections: savedSelections, customUploads: savedUploads } = JSON.parse(saved);
        if (savedSelections) setSelections(savedSelections);
        if (savedUploads) setCustomUploads(savedUploads);
      } catch (e) {
        console.error("Failed to parse draft configurator selections", e);
      }
    }
    setDraftLoaded(true);
  }, [checking, pkg, packageId, questionnaireId]);

  // Save draft selections to localStorage
  useEffect(() => {
    if (!draftLoaded || checking || !pkg) return;
    const key = `tact_configurator_draft_${packageId}_${questionnaireId || "client"}`;
    localStorage.setItem(key, JSON.stringify({ selections, customUploads }));
  }, [selections, customUploads, packageId, questionnaireId, checking, pkg, draftLoaded]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user) return;
      setChecking(true);

      if (isOfficeConsultant && !questionnaireId) {
        toast.info(lang === "ar" ? "ابدأ جلسة مكتب جديدة أولاً" : "Start a new office session first");
        nav("/office-session");
        return;
      }

      if (isOfficeConsultant && questionnaireId) {
        const { data: questionnaireData, error: questionnaireError } = await supabase
          .from("questionnaires")
          .select("id,name,phone,email")
          .eq("id", questionnaireId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (questionnaireError || !questionnaireData) {
          toast.error(lang === "ar" ? "تعذر فتح استبيان جلسة المكتب" : "Could not open the office session questionnaire");
          nav("/office-session");
          return;
        }

        setLinkedQuestionnaire(questionnaireData as QuestionnaireSnapshot);
      } else {
        setLinkedQuestionnaire(null);
      }

      // Normal clients use their latest saved questionnaire. If none exists, collect it once before configuring.
      let questionnaireFilled = true;
      if (!isAdmin && !isOfficeConsultant) {
        const { data: questionnaireData, error: questionnaireError } = await supabase
          .from("questionnaires")
          .select("id,name,phone,email")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (questionnaireError || !questionnaireData) {
          questionnaireFilled = false;
        } else {
          setLinkedQuestionnaire(questionnaireData as QuestionnaireSnapshot);
        }
      }

      if (!alive) return;

      if (!questionnaireFilled) {
        toast.info(
          lang === "ar"
            ? "يرجى ملء استبيان متطلبات العميل أولاً قبل البدء في تخصيص الباقة"
            : "Please fill out the client questionnaire first before customizing the package"
        );
        const next = `${location.pathname}${location.search}`;
        nav(`/questionnaire?next=${encodeURIComponent(next)}`);
        return;
      }

      const [packageData, styleData, unlocked] = await Promise.all([
        getPackage(packageId),
        getPackageStyles(packageId),
        isPackageUnlocked(user.id, packageId, !!profile?.packages_unlocked),
      ]);
      if (!alive) return;
      setPkg(packageData);
      setStyles(styleData);
      setAllowed(isAdmin || isOfficeConsultant || unlocked);
      setChecking(false);
    }
    if (!loading && user) load();
    return () => {
      alive = false;
    };
  }, [packageId, user, loading, profile?.packages_unlocked, isAdmin, isOfficeConsultant, questionnaireId, lang, nav, location.pathname, location.search]);

  // Reset scroll to top when lightbox opens
  useEffect(() => {
    if (zoomTile && lightboxScrollRef.current) {
      lightboxScrollRef.current.scrollTop = 0;
    }
  }, [zoomTile]);

  useEffect(() => {
    if (!zoomTile) return;
    document.body.classList.add("package-lightbox-open");
    return () => {
      document.body.classList.remove("package-lightbox-open");
    };
  }, [zoomTile]);

  // Keyboard navigation for Configurator zoomed tile
  useEffect(() => {
    if (!zoomTile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (lang === "ar") {
          handlePrevTile();
        } else {
          handleNextTile();
        }
      } else if (e.key === "ArrowLeft") {
        if (lang === "ar") {
          handleNextTile();
        } else {
          handlePrevTile();
        }
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomTile, imageTiles, lang]);



  const sortedSections = useMemo(() => {
    return Object.entries(selections)
      .sort(([, a], [, b]) => {
        if (!!a.is_style_preview !== !!b.is_style_preview) return a.is_style_preview ? -1 : 1;
        const weightA = getPackageCategoryWeight({
          slug: a.category_slug || a.category_id,
          name_en: a.category,
          name_ar: a.category,
          sort_order: a.sort_order ?? 0,
        });
        const weightB = getPackageCategoryWeight({
          slug: b.category_slug || b.category_id,
          name_en: b.category,
          name_ar: b.category,
          sort_order: b.sort_order ?? 0,
        });
        if (weightA !== weightB) return weightA - weightB;
        return (a.sort_order ?? 999) - (b.sort_order ?? 999);
      });
  }, [selections]);
  const orderedSelections = useMemo(
    () => Object.fromEntries(sortedSections),
    [sortedSections]
  );
  const selectedItems = useMemo(() => sortedSections.flatMap(([, section]) => Object.values(section.selected ?? {})), [sortedSections]);
  const selectedCount = selectedItems.length + customUploads.length;
  const zoomSelection = zoomTile && currentSectionSelection ? currentSectionSelection.selected?.[zoomTile.id] : undefined;

  const updateSection = (patch: Partial<SectionSelection>) => {
    if (!activeStyle || !activeSection) return;
    const key = `${activeStyle.id}_${activeSection.id}`;
    const categoryName = lang === "ar" ? activeSection.name_ar : activeSection.name_en;
    setSelections((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? emptySectionSelection(activeStyle, activeSection, categoryName)),
        ...patch,
      },
    }));
  };

  const toggleTile = (tile: ImageTile) => {
    if (!activeStyle || !activeSection) return;
    const key = `${activeStyle.id}_${activeSection.id}`;
    const categoryName = lang === "ar" ? activeSection.name_ar : activeSection.name_en;
    setSelections((current) => {
      const section = current[key] ?? emptySectionSelection(activeStyle, activeSection, categoryName);
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
          option_name: tile.label,
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
    const finalSections = { ...orderedSelections };
    const finalSectionsOrder = sortedSections.map(([key]) => key);

    if (customUploads.length > 0) {
      const customKey = "custom_uploads";
      finalSectionsOrder.push(customKey);
      finalSections[customKey] = {
        style_id: "custom_uploads",
        style: lang === "ar" ? "خارج الكتالوج" : "Out of Catalog",
        category_id: "custom_category",
        category: lang === "ar" ? "صور خارجية مخصصة" : "Custom Uploads",
        notes: "",
        selected: customUploads.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<string, SelectionItem>),
      };
    }

    const clientSnapshot = linkedQuestionnaire
      ? {
          client_name: linkedQuestionnaire.name,
          client_phone: linkedQuestionnaire.phone,
          client_email: linkedQuestionnaire.email,
        }
      : {};

    const { data: savedSelection, error } = await supabase.from("configurator_selections").insert({
      user_id: user.id,
      package_id: packageId,
      questionnaire_id: linkedQuestionnaire?.id ?? null,
      ...clientSnapshot,
      selections: {
        version: 2,
        package_id: packageId,
        package_name: lang === "ar" ? pkg?.name_ar : pkg?.name_en,
        questionnaire_id: linkedQuestionnaire?.id ?? null,
        ...clientSnapshot,
        sections_order: finalSectionsOrder,
        sections: finalSections,
      },
    }).select("id").single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const draftKey = `tact_configurator_draft_${packageId}_${questionnaireId || "client"}`;
    localStorage.removeItem(draftKey);
    toast.success(lang === "ar" ? "تم حفظ اختياراتك وملاحظاتك بنجاح" : "Selections saved successfully");
    setTimeout(() => {
      if (isOfficeSession && savedSelection?.id) {
        nav(`/office-session/report/${savedSelection.id}`);
      } else {
        nav("/customer");
      }
    }, 900);
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
          {isOfficeSession ? (
            <button
              onClick={() => nav(`/office-session?questionnaireId=${questionnaireId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 hover:bg-gold/25 px-4 py-2 text-xs font-bold text-gold transition-all duration-300 mb-6 cursor-pointer"
            >
              {lang === "ar" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>
                {lang === "ar" 
                  ? `العودة لاختيار الباقة للعميل (${linkedQuestionnaire?.name || "..."})` 
                  : `Back to client package selection (${linkedQuestionnaire?.name || "..."})`}
              </span>
            </button>
          ) : (
            <button
              onClick={() => nav("/packages")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white/80 transition-all duration-300 mb-6 cursor-pointer"
            >
              {lang === "ar" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>{lang === "ar" ? "العودة لباقات التشطيب" : "Back to Packages Tiers"}</span>
            </button>
          )}
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
                <div
                  key={style.id}
                  onMouseEnter={() => {
                    if (coverUrl) {
                      setActiveHoverPreview({
                        url: coverUrl,
                        label: lang === "ar" ? `${style.name_ar} - التصميم المقترح` : `${style.name_en} - Proposed Style`
                      });
                    }
                  }}
                  onMouseLeave={() => setActiveHoverPreview(null)}
                  className={cn(
                    "group text-start rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[260px] overflow-hidden border",
                    isActive 
                      ? "bg-gradient-to-br from-[#0F3D42] to-[#0A2629] border-gold shadow-[0_15px_40px_rgba(212,175,55,0.18)] ring-1 ring-gold/40" 
                      : "bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-lg hover:shadow-black/20"
                  )}
                >
                  {/* Invisible Primary Selection Action button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStyleIdx(idx);
                      setActiveSecIdx(0);
                      setShowStylePreview(true);
                      window.scrollTo({ top: 260, behavior: "smooth" });
                    }}
                    className="absolute inset-0 w-full h-full z-10 cursor-pointer text-start"
                    aria-label={lang === "ar" ? `اختيار ستايل ${style.name_ar}` : `Select style ${style.name_en}`}
                  />

                  {/* Absolute Zoom Button */}
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const styleCoverTile = {
                          id: `style-cover-${style.id}`,
                          option: previewCat?.options?.[0] || ({ id: `style-opt-${style.id}`, name_ar: style.name_ar, name_en: style.name_en, sort_order: 0 } as CatalogOption),
                          imageUrl: coverUrl,
                          label: lang === "ar" ? `${style.name_ar} - التصميم المقترح` : `${style.name_en} - Visual Style`
                        } as ImageTile;
                        setZoomTile(styleCoverTile);
                        resetZoom();
                      }}
                      className="absolute top-4 end-4 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white hover:bg-gold hover:border-gold hover:text-brand-dark hover:scale-110 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg"
                      title={lang === "ar" ? "تكبير واستعراض تفاصيل الستايل" : "Zoom Style Cover"}
                    >
                      <ZoomIn size={16} />
                    </button>
                  )}

                  {/* Cover Image Background */}
                  {coverUrl && (
                    <>
                      <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                      <div className={cn(
                        "absolute inset-0 transition-all duration-500 pointer-events-none",
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
                  <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Header: Category count & Active state */}
                  <div className="flex items-center justify-between w-full relative z-10 pointer-events-none">
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
                  <div className="mt-6 relative z-10 pointer-events-none">
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
                  <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs relative z-10 pointer-events-none">
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="configurator-content-section" className="py-12 bg-[#f8f5ee]" dir={lang === "ar" ? "rtl" : "ltr"}>
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
                      scrollToContentSection();
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
              {activeSecIdx < sections.length - 1 ? (
                <button
                  onClick={() => {
                    scrollToContentSection();
                    setActiveSecIdx((current) => current + 1);
                  }}
                  className="btn-gold w-full flex items-center justify-center gap-1.5"
                >
                  <span>{lang === "ar" ? "التصنيف التالي" : "Next Category"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <button
                  disabled
                  className="btn-gold w-full flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
                >
                  <span>{lang === "ar" ? "التصنيف التالي" : "Next Category"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
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
              <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-mono">
                  {imageTiles.length} {lang === "ar" ? "صورة" : "images"}
                </span>
              </div>
            </header>

            <div id="package-image-grid" className={cn("grid auto-rows-max items-start gap-5", showStylePreview ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {paginatedTiles.map((tile, pageTileIndex) => {
                const tileIndex = currentPage * ITEMS_PER_PAGE + pageTileIndex;
                const item = currentSectionSelection?.selected?.[tile.id];
                const isSelected = !!item;
                return (
                  <article
                    key={tile.id}
                    onMouseEnter={() => {
                      if (tile.imageUrl) {
                        setActiveHoverPreview({
                          url: tile.imageUrl,
                          label: tile.label
                        });
                      }
                    }}
                    onMouseLeave={() => setActiveHoverPreview(null)}
                    className={cn(
                      "group self-start h-fit bg-white rounded-[14px] border overflow-hidden shadow-sm transition-all duration-300",
                      isSelected ? "border-gold ring-2 ring-gold/20 shadow-lg" : "border-border hover:border-gold/60 hover:shadow-md"
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setZoomTile(tile);
                        resetZoom();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setZoomTile(tile);
                          resetZoom();
                        }
                      }}
                      className="block w-full text-start cursor-zoom-in"
                    >
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {tile.imageUrl ? (
                          <img
                            src={tile.imageUrl}
                            alt={tile.label}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover image-crisp bg-white/5 transition-transform duration-700 ease-out group-hover:scale-108"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground"><Image size={28} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <span className="absolute top-3 start-3 bg-black/45 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/10">
                          {String(tileIndex + 1).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTile(tile);
                          }}
                          className={cn("absolute top-3 end-3 z-20 w-9 h-9 rounded-full border grid place-items-center transition-all", isSelected ? "bg-gold border-gold text-teal-deep" : "bg-black/35 border-white/25 text-white hover:bg-gold hover:border-gold hover:text-teal-deep")}
                          title={isSelected ? (lang === "ar" ? "إلغاء التحديد" : "Unselect") : (lang === "ar" ? "تحديد الصورة" : "Select image")}
                        >
                          <Check size={18} />
                        </button>
                        
                        {/* Hover Zoom Overlay (Desktop) */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-gold/90 text-brand-dark flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <ZoomIn size={18} className="stroke-[2.5]" />
                          </div>
                        </div>

                        <div className="absolute bottom-3 start-3 end-12 text-white">
                          <h4 className="font-serif-ar text-base drop-shadow line-clamp-2">{tile.label}</h4>
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
                    </div>
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

            {/* Pagination Controls */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 select-none pt-2 pb-6" dir={lang === "ar" ? "rtl" : "ltr"}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(p - 1, 0));
                    scrollToContentSection();
                  }}
                  disabled={currentPage === 0}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-white text-teal-deep hover:bg-teal-soft/20 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm cursor-pointer"
                >
                  {lang === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
                
                <div className="flex items-center gap-1.5 px-3">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCurrentPage(i);
                        scrollToContentSection();
                      }}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
                        currentPage === i
                          ? "bg-gold text-teal-deep shadow-md font-extrabold"
                          : "border border-border bg-white text-muted-foreground hover:bg-teal-soft/10"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(p + 1, pageCount - 1));
                    scrollToContentSection();
                  }}
                  disabled={currentPage === pageCount - 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-white text-teal-deep hover:bg-teal-soft/20 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm cursor-pointer"
                >
                  {lang === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            )}

            {showStylePreview && (
              <div className="flex justify-end mb-6">
                <button 
                  onClick={() => { 
                    setShowStylePreview(false); 
                    setActiveSecIdx(0); 
                    scrollToContentSection(); 
                  }} 
                  className="btn-gold w-full sm:w-auto flex items-center justify-center gap-1.5 px-8 py-4 text-sm font-bold shadow-md cursor-pointer whitespace-nowrap"
                >
                  <span>{lang === "ar" ? "التالي: اختيارات البنود" : "Next: item choices"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            )}

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

            {/* Custom Image Upload Section */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
                <div>
                  <h3 className="font-serif-ar text-lg text-teal-deep font-bold">
                    {lang === "ar" ? "هل لديك صور خارجية تود تنفيذها؟ (اختياري)" : "Do you have external designs? (Optional)"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "يمكنك رفع أي صورة خارجية من خارج الكتالوج وسنقوم بتضمينها للمهندس والمدير للتنفيذ."
                      : "Upload any custom image outside the catalog to share with your engineer."}
                  </p>
                </div>
                <label className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-gold bg-gold px-6 py-3 text-xs font-bold text-teal-deep transition hover:bg-transparent hover:text-gold",
                  uploadingCustom && "opacity-55 pointer-events-none"
                )}>
                  <Upload size={14} className={cn(uploadingCustom && "animate-spin")} />
                  <span>{uploadingCustom ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (lang === "ar" ? "رفع صورة مخصصة" : "Upload Custom Image")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingCustom}
                    onChange={handleCustomImageUpload}
                  />
                </label>
              </div>

              {customUploads.length > 0 ? (
                <div className="space-y-6 divide-y divide-border">
                  {customUploads.map((item, index) => (
                    <div key={item.id} className="pt-6 first:pt-0 grid md:grid-cols-[160px_1fr] gap-6 items-start">
                      {/* Image preview with delete button overlay */}
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center group shadow-sm">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeCustomUpload(item.id)}
                          className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white gap-1.5 text-xs font-bold cursor-pointer"
                        >
                          <X size={16} />
                          <span>{lang === "ar" ? "إزالة الصورة" : "Remove"}</span>
                        </button>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1 font-bold">
                              {lang === "ar" ? "مكان الاستخدام" : "Usage Location"}
                            </label>
                            <Input
                              value={item.place}
                              onChange={(e) => updateCustomUploadField(item.id, 'place', e.target.value)}
                              className="h-10 bg-white text-xs"
                              placeholder={lang === "ar" ? "مثلاً: غرفة النوم الرئيسية" : "e.g. Master Bedroom"}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1 font-bold">
                              {lang === "ar" ? "الكمية التقديرية" : "Est. Qty"}
                            </label>
                            <Input
                              value={item.qty}
                              onChange={(e) => updateCustomUploadField(item.id, 'qty', e.target.value)}
                              className="h-10 bg-white text-xs"
                              placeholder={lang === "ar" ? "مثلاً: 12 م²" : "e.g. 12 m²"}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-muted-foreground block mb-1 font-bold">
                            {lang === "ar" ? "ملاحظتك أو مواصفات التصميم المطلوبة" : "Image notes / specifications"}
                          </label>
                          <Textarea
                            value={item.note}
                            onChange={(e) => updateCustomUploadField(item.id, 'note', e.target.value)}
                            placeholder={lang === "ar" ? "اكتب تفاصيل التصميم المطلوب تنفيذه من هذه الصورة..." : "Detail what you want from this image..."}
                            className="min-h-[70px] resize-none text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground/60 text-xs border border-dashed border-border rounded-xl">
                  {lang === "ar" 
                    ? "لا توجد صور خارجية مرفوعة حالياً. يمكنك رفع صور لإرفاقها بالتقرير."
                    : "No custom images uploaded yet. You can upload custom designs to attach to the report."}
                </div>
              )}
            </div>

            <h3 className="font-serif-ar text-xl text-teal-deep font-bold mb-3 mt-8">{lang === "ar" ? "البنود التالية المختارة" : "Selected Items"}</h3>
            {selectedCount > 0 && (
              <div className="bg-teal-deep text-ivory rounded-2xl border border-gold/25 p-6">
                <h3 className="font-serif-ar text-2xl mb-4">{lang === "ar" ? "ملخص الصور المختارة" : "Selected Summary"}</h3>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {/* Standard catalogue items */}
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
                        className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                        title={lang === "ar" ? "إزالة" : "Remove"}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Custom upload items */}
                  {customUploads.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl bg-white/8 border border-amber-500/30 p-2 relative group/item ring-1 ring-amber-500/20">
                      {item.image_url && <img src={item.image_url} alt={item.option_name} className="w-16 h-16 rounded-lg object-cover border border-amber-500/30" />}
                      <div className="min-w-0 text-sm flex-1">
                        <span className="inline-block text-[9px] font-bold bg-amber-500/25 text-amber-300 px-1.5 py-0.5 rounded mb-0.5">
                          {lang === "ar" ? "صورة مخصصة خارجية" : "Custom Upload"}
                        </span>
                        <div className="text-amber-300/80 text-xs truncate">{item.category}</div>
                        <div className="font-bold truncate text-white">{item.option_name}</div>
                        {item.note && <div className="text-amber-200/70 text-xs line-clamp-2 mt-1">{item.note}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomUpload(item.id)}
                        className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                        title={lang === "ar" ? "إزالة" : "Remove"}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showStylePreview && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button 
                  disabled={activeSecIdx === 0} 
                  onClick={() => {
                    setActiveSecIdx((current) => current - 1);
                    scrollToContentSection();
                  }} 
                  className="btn-ghost-light !text-teal-deep !border-teal-deep/30 disabled:opacity-30 flex items-center gap-1.5"
                >
                  {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  <span>{lang === "ar" ? "التصنيف السابق" : "Previous"}</span>
                </button>
                <button disabled={busy || !selectedCount} onClick={submit} className="btn-gold flex items-center gap-2 px-8 disabled:opacity-50 font-bold">
                  <Check size={16} />
                  <span>{busy ? "..." : lang === "ar" ? "حفظ وإرسال الاختيارات" : "Save Selections"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox / Zoom Dialog Modal */}
      {zoomTile && createPortal((
        <div 
          className="fixed inset-0 z-[9999] flex flex-col bg-[#061d20] text-white"
          dir={lang === "ar" ? "rtl" : "ltr"}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Header Bar — hidden in TV Presentation Mode */}
          <div className={cn(
            "flex-shrink-0 bg-[#061d20]/95 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between gap-3 border-b border-white/10 z-20 transition-all",
            isPresentationMode && "hidden"
          )}>
            <div>
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.2em] block mb-1">
                {lang === "ar" ? "معاينة التفاصيل الدقيقة والخامات" : "FINE DETAIL & MATERIAL INSPECTION"}
              </span>
              <h2 className="font-serif-ar text-sm md:text-xl text-white font-bold drop-shadow line-clamp-1">
                {zoomTile.label || (lang === "ar" ? zoomTile.option.name_ar : zoomTile.option.name_en)}
              </h2>
            </div>
            
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              {/* Selection State Indicator / Toggle */}
              {activeStyle && activeSection && !zoomTile.id.startsWith("style-cover-") && (
                <button
                  onClick={() => toggleTile(zoomTile)}
                  className={cn(
                    "px-3 md:px-5 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 border shadow-lg cursor-pointer",
                    zoomSelection
                      ? "bg-gold border-gold text-[#0C363A] hover:bg-white hover:border-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  )}
                >
                  <Check size={13} className="stroke-[3]" />
                  <span className="hidden sm:inline">
                    {zoomSelection
                      ? (lang === "ar" ? "محدد ومختار" : "SELECTED CHOICE")
                      : (lang === "ar" ? "تحديد هذا الخيار" : "SELECT OPTION")
                    }
                  </span>
                </button>
              )}

              {/* TV Mode Toggle button */}
              <button
                type="button"
                onClick={() => {
                  setIsPresentationMode(true);
                  resetZoom();
                }}
                className="px-3 py-2 h-11 rounded-full text-[11px] md:text-xs font-bold bg-white/10 border border-white/20 text-white hover:bg-gold hover:border-gold hover:text-teal-deep transition-all duration-300 flex items-center gap-1.5 shadow-lg cursor-pointer"
                title={lang === "ar" ? "وضع العرض التقديمي للتلفزيون" : "TV Presentation Mode"}
              >
                <Maximize2 size={15} />
                <span>{lang === "ar" ? "وضع العرض" : "TV Mode"}</span>
              </button>

              <button
                onClick={closeLightbox}
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-300 border border-white/20 shadow-xl cursor-pointer"
                title={lang === "ar" ? "إغلاق" : "Close"}
                aria-label={lang === "ar" ? "إغلاق" : "Close"}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Floating Exit TV Presentation Mode button */}
          {isPresentationMode && (
            <button
              onClick={() => setIsPresentationMode(false)}
              className={cn(
                "absolute top-6 z-50 px-6 py-3 rounded-full bg-gold hover:bg-white border-2 border-gold text-[#0C363A] text-xs font-bold tracking-wider shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer scale-110",
                lang === "ar" ? "left-6" : "right-6"
              )}
            >
              <X size={16} />
              <span>{lang === "ar" ? "إلغاء وضع العرض" : "Exit TV Mode"}</span>
            </button>
          )}

          {/* Main Content Area — only this scrolls */}
          <div ref={lightboxScrollRef} className={cn("flex-1 overflow-y-auto w-full bg-[#061d20]", isPresentationMode && "overflow-hidden")}>
            <div className={cn("mx-auto w-full max-w-[1520px] px-3 md:px-6 py-5 flex flex-col gap-5", isPresentationMode && "p-0 max-w-full h-full justify-center")}>
            
            {/* Image Frame Card Container */}
            <div 
              className={cn(
                "relative w-full rounded-[14px] bg-[#020607] overflow-hidden flex items-center justify-center select-none cursor-zoom-in border border-white/10 transition-all duration-300",
                isPresentationMode 
                  ? "h-screen max-h-screen rounded-none border-none bg-black" 
                  : "h-[calc(100vh-270px)] min-h-[320px] max-h-[68vh] shadow-[0_22px_80px_rgba(0,0,0,0.45)]"
              )}
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
              {/* Nav Arrows inside image frame container — made extra large in TV Mode */}
              {imageTiles.findIndex((t) => t.id === zoomTile.id) > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevTile(); }}
                  className={cn(
                    "absolute z-10 rounded-full bg-black/60 border border-white/15 text-white hover:bg-gold hover:text-[#0C363A] hover:border-gold flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer top-1/2 -translate-y-1/2",
                    isPresentationMode ? "w-20 h-20 border-2" : "w-9 h-9 md:w-11 md:h-11",
                    lang === "ar" ? "right-3 md:right-4" : "left-3 md:left-4"
                  )}
                  title={lang === "ar" ? "الصورة السابقة" : "Previous Image"}
                >
                  {lang === "ar" ? (
                    <ChevronRight size={isPresentationMode ? 40 : 18} />
                  ) : (
                    <ChevronLeft size={isPresentationMode ? 40 : 18} />
                  )}
                </button>
              )}

              {imageTiles.findIndex((t) => t.id === zoomTile.id) < imageTiles.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextTile(); }}
                  className={cn(
                    "absolute z-10 rounded-full bg-black/60 border border-white/15 text-white hover:bg-gold hover:text-[#0C363A] hover:border-gold flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer top-1/2 -translate-y-1/2",
                    isPresentationMode ? "w-20 h-20 border-2" : "w-9 h-9 md:w-11 md:h-11",
                    lang === "ar" ? "left-3 md:left-4" : "right-3 md:right-4"
                  )}
                  title={lang === "ar" ? "الصورة التالية" : "Next Image"}
                >
                  {lang === "ar" ? (
                    <ChevronLeft size={isPresentationMode ? 40 : 18} />
                  ) : (
                    <ChevronRight size={isPresentationMode ? 40 : 18} />
                  )}
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
                    className={cn(
                      "max-w-full max-h-full object-contain pointer-events-none select-none",
                      isPresentationMode ? "max-h-screen max-w-full" : ""
                    )}
                  />
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10 text-white/50">
                    <Image size={48} className="mb-4" />
                    <span>{lang === "ar" ? "لا توجد صورة متوفرة" : "No image available"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Control Bar and Note Section directly below the image frame — hidden in TV Mode */}
            {!isPresentationMode && (
              <div className="w-full flex flex-col gap-5 items-center">
                
                {/* Zoom Pill and Image Index Counter */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d3436] border border-white/10 p-4 rounded-[14px] shadow-xl">
                  
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
                  <div className="bg-[#061d20] border border-white/15 px-4 py-2 rounded-full flex items-center gap-3 md:gap-4 shadow-lg">
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
                  <div className="w-full bg-[#0d3436] border border-gold/25 rounded-[14px] p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                    {/* Subtle background golden aura */}
                    <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-gold/5 blur-2xl pointer-events-none" />
                    
                    {zoomTile.id.startsWith("style-cover-") ? (
                      <div className="py-4 text-center text-gold font-serif-ar font-bold text-sm bg-black/15 border border-gold/20 rounded-xl">
                        {lang === "ar"
                          ? "هذه صورة تعبيرية للستايل العام. يمكنك استعراض بنود وتفاصيل التشطيب في الأقسام بالأسفل لاختيار عناصر وتفاصيل محددة وتدوين الملاحظات عليها."
                          : "This is a visual reference for the general style category. Please select specific option cards below to add notes and customize."}
                      </div>
                    ) : (
                      <>
                        <div className="border-b border-white/10 pb-4">
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

                        {/* Notes Textarea (Only visible if item is selected) */}
                        {zoomSelection ? (
                          <div className="space-y-2 mt-1">
                            <label className="text-xs font-bold text-gold flex items-center gap-1.5">
                              <StickyNote size={14} />
                              <span>{lang === "ar" ? "ملاحظتك على الصورة" : "Image note"}</span>
                            </label>
                            <Textarea
                              value={zoomSelection.note ?? ""}
                              onChange={(e) => updateItemNote(zoomTile.id, e.target.value)}
                              placeholder={lang === "ar" ? "مثلاً: عاجبني اللون، عايز نفس الفكرة في الحمام الرئيسي..." : "What do you like about this image?"}
                              className="min-h-[100px] resize-none bg-white border-white/20 text-[#0C363A] placeholder:text-[#0C363A]/45 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 rounded-xl select-text text-sm"
                            />
                            <div className="flex justify-start pt-1">
                              <button
                                type="button"
                                onClick={saveLightboxNote}
                                className="inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gold px-6 py-3 text-xs font-bold text-[#0C363A] shadow-lg transition hover:bg-white hover:border-white cursor-pointer"
                              >
                                <Check size={15} className="stroke-[3]" />
                                <span>{lang === "ar" ? "حفظ الملاحظة" : "Save note"}</span>
                              </button>
                            </div>
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
                      </>
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
            )}
          </div>{/* end lightbox inner */}
          </div>{/* end scroll container */}
        </div>
      ), document.body)}

      {/* Hover Preview Overlay */}
      <HoverPreview
        imageUrl={zoomTile ? null : (activeHoverPreview?.url || null)}
        label={zoomTile ? null : (activeHoverPreview?.label || null)}
        lang={lang}
      />
    </>
  );
}
