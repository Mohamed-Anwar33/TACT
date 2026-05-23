import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  Home,
  Image,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  Search,
  Calendar,
  User,
  Phone,
  MapPin,
  Building,
  Clock,
  Clipboard,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const db = supabase as any;

const pageTabs = [
  { slug: "home", ar: "الرئيسية", en: "Home", icon: Home },
  { slug: "services", ar: "خدماتنا", en: "Services", icon: Briefcase },
  { slug: "portfolio", ar: "أعمالنا", en: "Portfolio", icon: Image },
  { slug: "team", ar: "فريق العمل", en: "Team", icon: Users },
  { slug: "testimonials", ar: "العملاء", en: "Clients", icon: MessageSquare },
  { slug: "contact", ar: "تواصل معنا", en: "Contact", icon: Mail },
  { slug: "questionnaire", ar: "استبيانات العملاء", en: "Customer Questionnaires", icon: FileText },
  { slug: "media", ar: "مكتبة الميديا", en: "Media Library", icon: Upload },
];

const blankSection = {
  id: "",
  page_slug: "home",
  section_key: "",
  section_name_en: "",
  section_name_ar: "",
  title_en: "",
  title_ar: "",
  body_en: "",
  body_ar: "",
  cta_label_en: "",
  cta_label_ar: "",
  cta_url: "",
  sort_order: 0,
  visible: true,
};

const blankService = { id: "", slug: "", number_label: "", title_en: "", title_ar: "", short_en: "", short_ar: "", detail_en: "", detail_ar: "", icon: "", image_url: "", video_url: "", sort_order: 0, visible: true };
const blankProject = { id: "", title_en: "", title_ar: "", category_en: "", category_ar: "", area: "", description_en: "", description_ar: "", cover_url: "", video_url: "", pdf_url: "", external_url: "", sort_order: 0, visible: true };
const blankTeam = { id: "", slug: "", name_en: "", name_ar: "", role_en: "", role_ar: "", department: "leadership", bio_en: "", bio_ar: "", image_url: "", sort_order: 0, visible: true };
const blankClient = { id: "", slug: "", name_en: "", name_ar: "", logo_url: "", description_en: "", description_ar: "", sort_order: 0, visible: true };
const blankReview = { id: "", client_id: "", client_name_en: "", client_name_ar: "", role_en: "", role_ar: "", quote_en: "", quote_ar: "", rating: 5, image_url: "", video_url: "", video_cover_url: "", sort_order: 0, visible: true };

export default function AdminDashboard() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const { user, isAdmin, canManageContent, loading, signOut } = useAuth();
  const [active, setActive] = useState("home");
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionMedia, setSectionMedia] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [contact, setContact] = useState<any>({});
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any | null>(null);
  const [questionnaireSearch, setQuestionnaireSearch] = useState("");

  const [sectionForm, setSectionForm] = useState<any>(blankSection);
  const [serviceForm, setServiceForm] = useState<any>(blankService);
  const [projectForm, setProjectForm] = useState<any>(blankProject);
  const [teamForm, setTeamForm] = useState<any>(blankTeam);
  const [clientForm, setClientForm] = useState<any>(blankClient);
  const [reviewForm, setReviewForm] = useState<any>(blankReview);
  const [contactForm, setContactForm] = useState<any>({ phone_numbers: "", whatsapp: "", email: "", address_ar: "", address_en: "", map_url: "", facebook: "", instagram: "", tiktok: "", title_ar: "", title_en: "", body_ar: "", body_en: "" });

  const label = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const tabLabel = (tab: any) => (lang === "ar" ? tab.ar : tab.en);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/admin/login");
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin || canManageContent) load();
  }, [isAdmin, canManageContent]);

  useEffect(() => {
    setSectionForm((current: any) => ({ ...current, page_slug: active === "media" ? "home" : active }));
  }, [active]);

  const activeSections = useMemo(() => sections.filter((section) => section.page_slug === active), [sections, active]);

  async function load() {
    const [sectionRes, sectionMediaRes, servicesRes, projectsRes, projectMediaRes, teamRes, clientsRes, reviewsRes, contactRes, mediaRes, messagesRes, questionnairesRes] = await Promise.all([
      db.from("cms_sections").select("*").order("page_slug").order("sort_order"),
      db.from("cms_section_media").select("*").order("sort_order"),
      db.from("cms_services").select("*").order("sort_order"),
      db.from("cms_projects").select("*").order("sort_order"),
      db.from("cms_project_media").select("*").order("project_id").order("sort_order"),
      db.from("cms_team_members").select("*").order("sort_order"),
      db.from("cms_clients").select("*").order("sort_order"),
      db.from("cms_client_testimonials").select("*").order("sort_order"),
      db.from("cms_contact_settings").select("*").maybeSingle(),
      db.from("media_assets").select("*").order("created_at", { ascending: false }).limit(300),
      db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("questionnaires").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setSections(sectionRes.data ?? []);
    setSectionMedia(sectionMediaRes.data ?? []);
    setServices(servicesRes.data ?? []);
    setProjects(projectsRes.data ?? []);
    setProjectMedia(projectMediaRes.data ?? []);
    setTeam(teamRes.data ?? []);
    setClients(clientsRes.data ?? []);
    setReviews(reviewsRes.data ?? []);
    setContact(contactRes.data ?? {});
    setMediaAssets(mediaRes.data ?? []);
    setMessages(messagesRes.data ?? []);
    setQuestionnaires(questionnairesRes.data ?? []);
    const contactData = contactRes.data ?? {};
    setContactForm({
      phone_numbers: (contactData.phone_numbers || []).join("\n"),
      whatsapp: contactData.whatsapp || "",
      email: contactData.email || "",
      address_ar: contactData.address_ar || "",
      address_en: contactData.address_en || "",
      map_url: contactData.map_url || "",
      facebook: contactData.social_links?.facebook || "",
      instagram: contactData.social_links?.instagram || "",
      tiktok: contactData.social_links?.tiktok || "",
      title_ar: contactData.title_ar || "",
      title_en: contactData.title_en || "",
      body_ar: contactData.body_ar || "",
      body_en: contactData.body_en || "",
    });
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error: any) {
      toast.error(error.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = { ...sectionForm, id: sectionForm.id || undefined, sort_order: Number(sectionForm.sort_order) || 0 };
      if (!payload.section_key) {
        payload.section_key = `section-${Date.now()}`;
      }
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;
      toast.success(label("تم حفظ القسم", "Section saved"));
      setSectionForm({ ...blankSection, page_slug: active });
      await load();
    });
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    await saveTable("cms_services", serviceForm, "slug", () => setServiceForm(blankService));
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    await saveTable("cms_projects", projectForm, "id", () => setProjectForm(blankProject));
  }

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault();
    await saveTable("cms_team_members", teamForm, "slug", () => setTeamForm(blankTeam));
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    await saveTable("cms_clients", clientForm, "slug", () => setClientForm(blankClient));
  }

  async function saveReview(e: React.FormEvent) {
    e.preventDefault();
    await saveTable("cms_client_testimonials", reviewForm, null, () => setReviewForm(blankReview));
  }

  async function saveTable(table: string, form: any, conflict: string | null, reset: () => void) {
    await run(async () => {
      const payload = { ...form, id: form.id || undefined, sort_order: Number(form.sort_order) || 0 };
      const query = conflict ? db.from(table).upsert(payload, { onConflict: conflict }) : db.from(table).upsert(payload);
      const { error } = await query;
      if (error) throw error;
      toast.success(label("تم الحفظ", "Saved"));
      reset();
      await load();
    });
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = {
        id: true,
        phone_numbers: String(contactForm.phone_numbers || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        whatsapp: contactForm.whatsapp,
        email: contactForm.email,
        address_ar: contactForm.address_ar,
        address_en: contactForm.address_en,
        map_url: contactForm.map_url,
        social_links: { facebook: contactForm.facebook, instagram: contactForm.instagram, tiktok: contactForm.tiktok },
        title_ar: contactForm.title_ar,
        title_en: contactForm.title_en,
        body_ar: contactForm.body_ar,
        body_en: contactForm.body_en,
      };
      const { error } = await db.from("cms_contact_settings").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      toast.success(label("تم حفظ بيانات التواصل", "Contact settings saved"));
      await load();
    });
  }

  async function remove(table: string, id: string, key = "id") {
    if (!confirm(label("تأكيد الحذف؟", "Confirm delete?"))) return;
    await run(async () => {
      const { error } = await db.from(table).delete().eq(key, id);
      if (error) throw error;
      toast.success(label("تم الحذف", "Deleted"));
      await load();
    });
  }

  async function upload(file: File, folder: string) {
    const safe = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
    const storagePath = `cms/${folder}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("tact-media").upload(storagePath, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("tact-media").getPublicUrl(storagePath);
    const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.includes("pdf") ? "pdf" : "file";
    await db.from("media_assets").upsert({
      bucket: "tact-media",
      path: storagePath,
      public_url: data.publicUrl,
      media_type: mediaType,
      title: file.name,
      alt: file.name,
      size_bytes: file.size,
      source_folder: folder,
      tags: [folder],
    }, { onConflict: "path" });
    return data.publicUrl;
  }

  async function uploadToField(file: File | undefined, folder: string, setUrl: (url: string) => void) {
    if (!file) return;
    await run(async () => {
      const url = await upload(file, folder);
      setUrl(url);
      toast.success(label("تم الرفع", "Uploaded"));
      await load();
    });
  }

  async function addSectionMedia(file: File | undefined, sectionId: string, role: string) {
    if (!file) return;
    await run(async () => {
      const url = await upload(file, "sections");
      const mediaType = file.type.startsWith("video/") ? "video" : file.type.includes("pdf") ? "pdf" : "image";
      const { error } = await db.from("cms_section_media").upsert({
        section_id: sectionId,
        role,
        media_type: mediaType,
        url,
        title_ar: file.name,
        title_en: file.name,
        visible: true,
      }, { onConflict: "section_id,role,url" });
      if (error) throw error;
      toast.success(label("تم ربط الميديا بالقسم", "Media attached"));
      await load();
    });
  }

  if (loading) return <div className="min-h-screen grid place-items-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#16231f]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#0C363A] p-5 text-white">
          <Link to="/" className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-[#C18556] text-[#C18556]">T</span>
            <span className="font-semibold">TACT CMS</span>
          </Link>
          <nav className="grid gap-1">
            {pageTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.slug} onClick={() => setActive(tab.slug)} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-start text-sm", active === tab.slug ? "bg-white text-[#0C363A]" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                  <Icon className="h-4 w-4" />
                  {tabLabel(tab)}
                </button>
              );
            })}
          </nav>
          <button onClick={async () => { await signOut(); navigate("/admin/login"); }} className="mt-8 flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <LogOut className="h-4 w-4" /> {label("خروج", "Logout")}
          </button>
        </aside>

        <section className="p-4 md:p-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C18556]">Content Management</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#0C363A]">{tabLabel(pageTabs.find((tab) => tab.slug === active) || pageTabs[0])}</h1>
            </div>
            <Link to={active === "home" || active === "media" ? "/" : `/${active}`} target="_blank" className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm text-[#0C363A]">
              <Eye className="h-4 w-4" /> {label("معاينة", "Preview")}
            </Link>
          </header>

          {active !== "media" && active !== "questionnaire" && (
            <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
              <Panel title={label("أقسام الصفحة", "Page sections")}>
                <form onSubmit={saveSection} className="grid gap-3">
                  <input type="hidden" value={sectionForm.section_key} />
                  <Input placeholder={label("اسم القسم عربي", "Section name AR")} value={sectionForm.section_name_ar} onChange={(e) => setSectionForm({ ...sectionForm, section_name_ar: e.target.value })} required disabled={!!sectionForm.id} />
                  <Input placeholder="Section name EN" value={sectionForm.section_name_en} onChange={(e) => setSectionForm({ ...sectionForm, section_name_en: e.target.value })} required disabled={!!sectionForm.id} />
                  <Input placeholder={label("العنوان عربي", "Title AR")} value={sectionForm.title_ar || ""} onChange={(e) => setSectionForm({ ...sectionForm, title_ar: e.target.value })} />
                  <Input placeholder="Title EN" value={sectionForm.title_en || ""} onChange={(e) => setSectionForm({ ...sectionForm, title_en: e.target.value })} />
                  <Textarea placeholder={label("الوصف عربي", "Body AR")} value={sectionForm.body_ar || ""} onChange={(e) => setSectionForm({ ...sectionForm, body_ar: e.target.value })} />
                  <Textarea placeholder="Body EN" value={sectionForm.body_en || ""} onChange={(e) => setSectionForm({ ...sectionForm, body_en: e.target.value })} />
                  <Input placeholder="CTA URL" value={sectionForm.cta_url || ""} onChange={(e) => setSectionForm({ ...sectionForm, cta_url: e.target.value })} />
                  <div className="flex gap-2">
                    <Button disabled={busy} className="flex-1"><Save className="h-4 w-4" /> {label("حفظ", "Save")}</Button>
                    <Button type="button" variant="outline" onClick={() => setSectionForm({ ...blankSection, page_slug: active })}>{label("جديد", "New")}</Button>
                  </div>
                </form>
              </Panel>

              <div className="grid gap-5">
                <Panel title={label("الأقسام الحالية", "Current sections")}>
                  <div className="grid gap-3">
                    {activeSections.map((section) => (
                      <div key={section.id} className="rounded-lg border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button className="text-start" onClick={() => setSectionForm(section)}>
                            <div className="font-semibold text-[#0C363A]">{lang === "ar" ? section.section_name_ar : section.section_name_en}</div>
                            <div className="text-xs text-muted-foreground">{section.section_key}</div>
                          </button>
                          <div className="flex gap-2">
                            {section.visible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            <button onClick={() => remove("cms_sections", section.id)}><Trash2 className="h-4 w-4 text-red-600" /></button>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {sectionMedia.filter((media) => media.section_id === section.id).map((media) => (
                            <div key={media.id} className="rounded border bg-muted/40 p-2 text-xs">
                              {media.media_type === "image" && <img src={media.url} className="mb-2 h-24 w-full rounded object-cover" />}
                              <div className="truncate">{media.role}: {media.url}</div>
                            </div>
                          ))}
                        </div>
                        <FileInput label={label("رفع ميديا لهذا القسم", "Upload media for this section")} onFile={(file) => addSectionMedia(file, section.id, "section")} />
                      </div>
                    ))}
                  </div>
                </Panel>

                {active === "services" && <ServicesEditor services={services} form={serviceForm} setForm={setServiceForm} save={saveService} remove={remove} uploadToField={uploadToField} label={label} busy={busy} />}
                {active === "portfolio" && <ProjectsEditor projects={projects} form={projectForm} setForm={setProjectForm} save={saveProject} remove={remove} uploadToField={uploadToField} label={label} busy={busy} />}
                {active === "team" && <TeamEditor members={team} form={teamForm} setForm={setTeamForm} save={saveTeam} remove={remove} uploadToField={uploadToField} label={label} busy={busy} />}
                {active === "testimonials" && <ClientsEditor clients={clients} reviews={reviews} clientForm={clientForm} setClientForm={setClientForm} reviewForm={reviewForm} setReviewForm={setReviewForm} saveClient={saveClient} saveReview={saveReview} remove={remove} uploadToField={uploadToField} label={label} busy={busy} />}
                {active === "contact" && <ContactEditor form={contactForm} setForm={setContactForm} save={saveContact} messages={messages} label={label} busy={busy} />}
              </div>
            </div>
          )}

          {active === "questionnaire" && (
            <QuestionnairesEditor
              questionnaires={questionnaires}
              selected={selectedQuestionnaire}
              setSelected={setSelectedQuestionnaire}
              search={questionnaireSearch}
              setSearch={setQuestionnaireSearch}
              remove={remove}
              label={label}
              busy={busy}
            />
          )}

          {active === "media" && (
            <div className="grid gap-5">
              <Panel title={label("رفع ملف جديد", "Upload new file")}>
                <p className="mb-3 text-sm text-muted-foreground">{label("الملفات الحالية تظل في public/real-content لتوفير مساحة Supabase. استخدم الرفع هنا للملفات الجديدة المهمة فقط.", "Existing files stay in public/real-content to save Supabase space. Upload here only for important new files.")}</p>
                <FileInput label={label("اختر ملف من الجهاز", "Choose file from device")} onFile={(file) => uploadToField(file, "library", () => null)} />
              </Panel>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mediaAssets.map((asset) => (
                  <Panel key={asset.id} className="p-0 overflow-hidden">
                    {asset.media_type === "image" && <img src={asset.public_url} className="h-40 w-full object-cover" />}
                    <div className="p-4">
                      <div className="truncate font-medium">{asset.title || asset.path}</div>
                      <button className="mt-2 text-xs text-[#C18556]" onClick={() => navigator.clipboard.writeText(asset.public_url)}>{label("نسخ الرابط", "Copy URL")}</button>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-[#e1dbce] bg-white p-5 shadow-sm", className)}>
      {title && <h2 className="mb-4 border-b pb-3 font-semibold text-[#0C363A]">{title}</h2>}
      {children}
    </section>
  );
}

function FileInput({ label, onFile }: { label: string; onFile: (file?: File) => void }) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#C18556] bg-[#FBF7F0] px-3 py-3 text-sm text-[#0C363A] hover:bg-[#F7EEDF]">
      <Upload className="h-4 w-4" />
      {label}
      <input type="file" className="hidden" onChange={(event) => onFile(event.currentTarget.files?.[0])} />
    </label>
  );
}

function VisibleBadge({ visible }: { visible: boolean }) {
  return <span className={cn("rounded-full px-2 py-1 text-xs", visible ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground")}>{visible ? "Show" : "Hide"}</span>;
}

function ServicesEditor({ services, form, setForm, save, remove, uploadToField, label, busy }: any) {
  return <CrudPanel title={label("إدارة الخدمات", "Manage services")} rows={services} renderName={(row: any) => row.title_ar || row.title_en} onEdit={setForm} onDelete={(row: any) => remove("cms_services", row.id)}>
    <form onSubmit={save} className="grid gap-3">
      <Input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
      <Input placeholder="Title AR" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
      <Input placeholder="Title EN" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} required />
      <Textarea placeholder="Short AR" value={form.short_ar} onChange={(e) => setForm({ ...form, short_ar: e.target.value })} />
      <Textarea placeholder="Short EN" value={form.short_en} onChange={(e) => setForm({ ...form, short_en: e.target.value })} />
      <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      <FileInput label={label("رفع صورة", "Upload image")} onFile={(file) => uploadToField(file, "services", (url: string) => setForm({ ...form, image_url: url }))} />
      <Button disabled={busy}><Save className="h-4 w-4" /> {label("حفظ الخدمة", "Save service")}</Button>
    </form>
  </CrudPanel>;
}

function ProjectsEditor({ projects, form, setForm, save, remove, uploadToField, label, busy }: any) {
  return <CrudPanel title={label("إدارة الأعمال", "Manage projects")} rows={projects} renderName={(row: any) => row.title_ar || row.title_en} onEdit={setForm} onDelete={(row: any) => remove("cms_projects", row.id)}>
    <form onSubmit={save} className="grid gap-3">
      <Input placeholder="project-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required />
      <Input placeholder="Title AR" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
      <Input placeholder="Title EN" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} required />
      <Input placeholder="Category AR" value={form.category_ar} onChange={(e) => setForm({ ...form, category_ar: e.target.value })} />
      <Textarea placeholder="Description AR" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
      <Input placeholder="Cover URL" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
      <Input placeholder="Video URL" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
      <Input placeholder="PDF URL" value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} />
      <FileInput label={label("رفع غلاف/صورة", "Upload cover/image")} onFile={(file) => uploadToField(file, "projects", (url: string) => setForm({ ...form, cover_url: url }))} />
      <Button disabled={busy}><Save className="h-4 w-4" /> {label("حفظ المشروع", "Save project")}</Button>
    </form>
  </CrudPanel>;
}

function TeamEditor({ members, form, setForm, save, remove, uploadToField, label, busy }: any) {
  return <CrudPanel title={label("إدارة فريق العمل", "Manage team")} rows={members} renderName={(row: any) => row.name_ar || row.name_en} onEdit={setForm} onDelete={(row: any) => remove("cms_team_members", row.id)}>
    <form onSubmit={save} className="grid gap-3">
      <Input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
      <Input placeholder="Name AR" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required />
      <Input placeholder="Name EN" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
      <Input placeholder="Role AR" value={form.role_ar} onChange={(e) => setForm({ ...form, role_ar: e.target.value })} />
      <Input placeholder="Department: leadership/design/site" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
      <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      <FileInput label={label("رفع صورة العضو", "Upload member photo")} onFile={(file) => uploadToField(file, "team", (url: string) => setForm({ ...form, image_url: url }))} />
      <Button disabled={busy}><Save className="h-4 w-4" /> {label("حفظ العضو", "Save member")}</Button>
    </form>
  </CrudPanel>;
}

function ClientsEditor({ clients, reviews, clientForm, setClientForm, reviewForm, setReviewForm, saveClient, saveReview, remove, uploadToField, label, busy }: any) {
  return <div className="grid gap-5">
    <CrudPanel title={label("إدارة العملاء", "Manage clients")} rows={clients} renderName={(row: any) => row.name_ar || row.name_en} onEdit={setClientForm} onDelete={(row: any) => remove("cms_clients", row.id)}>
      <form onSubmit={saveClient} className="grid gap-3">
        <Input placeholder="slug" value={clientForm.slug} onChange={(e) => setClientForm({ ...clientForm, slug: e.target.value })} required />
        <Input placeholder="Name AR" value={clientForm.name_ar} onChange={(e) => setClientForm({ ...clientForm, name_ar: e.target.value })} required />
        <Input placeholder="Name EN" value={clientForm.name_en} onChange={(e) => setClientForm({ ...clientForm, name_en: e.target.value })} required />
        <Input placeholder="Logo URL" value={clientForm.logo_url} onChange={(e) => setClientForm({ ...clientForm, logo_url: e.target.value })} />
        <FileInput label={label("رفع لوجو", "Upload logo")} onFile={(file) => uploadToField(file, "clients", (url: string) => setClientForm({ ...clientForm, logo_url: url }))} />
        <Button disabled={busy}>{label("حفظ العميل", "Save client")}</Button>
      </form>
    </CrudPanel>
    <CrudPanel title={label("آراء العملاء", "Client testimonials")} rows={reviews} renderName={(row: any) => row.client_name_ar || row.client_name_en || row.quote_ar} onEdit={setReviewForm} onDelete={(row: any) => remove("cms_client_testimonials", row.id)}>
      <form onSubmit={saveReview} className="grid gap-3">
        <Input placeholder="Client name AR" value={reviewForm.client_name_ar} onChange={(e) => setReviewForm({ ...reviewForm, client_name_ar: e.target.value })} />
        <Textarea placeholder="Quote AR" value={reviewForm.quote_ar} onChange={(e) => setReviewForm({ ...reviewForm, quote_ar: e.target.value })} />
        <Input placeholder="Video URL" value={reviewForm.video_url} onChange={(e) => setReviewForm({ ...reviewForm, video_url: e.target.value })} />
        <Input placeholder="Video cover URL" value={reviewForm.video_cover_url} onChange={(e) => setReviewForm({ ...reviewForm, video_cover_url: e.target.value })} />
        <FileInput label={label("رفع فيديو/غلاف", "Upload video/cover")} onFile={(file) => uploadToField(file, "client-reviews", (url: string) => setReviewForm({ ...reviewForm, video_url: url }))} />
        <Button disabled={busy}>{label("حفظ الرأي", "Save testimonial")}</Button>
      </form>
    </CrudPanel>
  </div>;
}

function ContactEditor({ form, setForm, save, messages, label, busy }: any) {
  return <div className="grid gap-5">
    <Panel title={label("بيانات التواصل", "Contact settings")}>
      <form onSubmit={save} className="grid gap-3">
        <Textarea placeholder={label("أرقام الهاتف - كل رقم في سطر", "Phone numbers - one per line")} value={form.phone_numbers} onChange={(e) => setForm({ ...form, phone_numbers: e.target.value })} />
        <Input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Facebook" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
        <Input placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <Input placeholder="Map URL" value={form.map_url} onChange={(e) => setForm({ ...form, map_url: e.target.value })} />
        <Button disabled={busy}>{label("حفظ التواصل", "Save contact")}</Button>
      </form>
    </Panel>
    <Panel title={label("رسائل التواصل", "Contact messages")}>
      <div className="grid gap-3">
        {messages.map((message: any) => <div key={message.id} className="rounded border p-3 text-sm"><b>{message.name}</b><div dir="ltr">{message.phone}</div><p>{message.message}</p></div>)}
      </div>
    </Panel>
  </div>;
}

function CrudPanel({ title, rows, children, renderName, onEdit, onDelete }: any) {
  return <Panel title={title}>
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div>{children}</div>
      <div className="grid gap-2 content-start">
        {rows.map((row: any) => (
          <div key={row.id || row.slug} className="flex items-center justify-between gap-3 rounded border bg-white p-3">
            <button className="text-start text-sm font-medium" onClick={() => onEdit(row)}>{renderName(row)}</button>
            <div className="flex items-center gap-2">
              <VisibleBadge visible={row.visible !== false} />
              <button onClick={() => onDelete(row)}><Trash2 className="h-4 w-4 text-red-600" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Panel>;
}

function QuestionnairesEditor({ questionnaires, selected, setSelected, search, setSearch, remove, label, busy }: any) {
  // Filter questionnaires based on search
  const filtered = questionnaires.filter((q: any) => {
    const term = search.toLowerCase();
    return (
      (q.name || "").toLowerCase().includes(term) ||
      (q.phone || "").toLowerCase().includes(term) ||
      (q.address || "").toLowerCase().includes(term) ||
      (q.email || "").toLowerCase().includes(term)
    );
  });

  // If none is selected, select the first one by default if filtered is not empty
  useEffect(() => {
    if (filtered.length > 0 && !selected) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected, setSelected]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Sidebar List */}
      <Panel title={label("قائمة الاستبيانات المستلمة", "Received Questionnaires")} className="h-[calc(100vh-220px)] flex flex-col">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-pulse" />
          <Input
            placeholder={label("البحث بالاسم، الهاتف، أو العنوان...", "Search by name, phone, address...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-10 border-border text-right md:text-left"
          />
        </div>

        {/* List of submissions */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {label("لا توجد استبيانات تطابق البحث", "No matching questionnaires found")}
            </div>
          ) : (
            filtered.map((q: any) => (
              <button
                key={q.id}
                onClick={() => setSelected(q)}
                className={cn(
                  "w-full text-right p-4 rounded-xl border transition-all duration-200 flex flex-col gap-1.5",
                  selected?.id === q.id
                    ? "border-[#C18556] bg-[#C18556]/5 text-[#0C363A] shadow-sm font-semibold"
                    : "border-border bg-white hover:border-[#C18556]/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm text-[#0C363A]">{q.name || label("عميل بدون اسم", "Anonymous Client")}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                    <Calendar className="h-3 w-3" />
                    {new Date(q.created_at).toLocaleDateString(label("ar-EG", "en-US"), { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{q.phone}</span>
                </div>
                {q.address && (
                  <div className="text-xs truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{q.address}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </Panel>

      {/* Detail Form view */}
      {selected ? (
        <Panel className="h-[calc(100vh-220px)] flex flex-col overflow-hidden p-0 border border-border">
          {/* Header */}
          <div className="p-6 border-b border-[#e1dbce] bg-[#0C363A] text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C18556] font-semibold">{label("استبيان عميل جديد", "NEW CLIENT QUESTIONNAIRE")}</p>
              <h2 className="text-xl font-bold font-serif-ar mt-1">{selected.name}</h2>
            </div>
            <button
              onClick={() => remove("questionnaires", selected.id)}
              disabled={busy}
              className="p-2.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 transition-all"
              title={label("حذف الاستبيان", "Delete submission")}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content body formatted beautifully */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#FBF7F0]">
            {/* Step 1: Basic Info */}
            <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                {label("1. المعلومات الأساسية للتواصل", "1. Basic Contact Information")}
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">{label("الاسم الكامل", "Full Name")}</span>
                  <span className="font-semibold text-teal-deep">{selected.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">{label("رقم الهاتف", "Phone / WhatsApp")}</span>
                  <span className="font-semibold text-teal-deep" dir="ltr">{selected.phone}</span>
                </div>
                {selected.email && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("البريد الإلكتروني", "Email Address")}</span>
                    <span className="font-semibold text-teal-deep">{selected.email}</span>
                  </div>
                )}
                {selected.address && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("عنوان الوحدة المراد تشطيبها", "Unit Location")}</span>
                    <span className="font-semibold text-teal-deep">{selected.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 & 3: Project & Occupants */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Project Info */}
              <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {label("2. تفاصيل المشروع", "2. Project Specifications")}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("نوع العقار", "Property Type")}</span>
                    <span className="font-semibold text-teal-deep bg-[#C18556]/10 text-[#0C363A] px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">{selected.project_type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("المرحلة الحالية من المشروع", "Current Condition")}</span>
                    <span className="font-semibold text-teal-deep bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">{selected.stage}</span>
                  </div>
                </div>
              </div>

              {/* Occupants & Services */}
              <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {label("3. الأسرة والخدمات المطلوبة", "3. Occupants & Scope")}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("عدد الأفراد المستخدمين للوحدة", "Target Occupants")}</span>
                    <span className="font-semibold text-teal-deep bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">{selected.family}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("الخدمات المطلوبة", "Scope of Work")}</span>
                    <span className="font-semibold text-teal-deep bg-[#0C363A]/10 text-[#0C363A] px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">{selected.service}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Expectations & Prioritized experience */}
            <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {label("4. التوقعات والتجربة السابقة", "4. Expectations & History")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("العامل الأهم / التوقعات", "Top Success Factor")}</span>
                    <span className="font-medium text-teal-deep">{selected.expectations || label("غير محدد", "Not specified")}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">{label("كيف سمعت عن الشركة؟", "Referral Source")}</span>
                    <span className="font-medium text-teal-deep">{selected.source || label("غير محدد", "Not specified")}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">{label("التجربة السابقة والتحديات", "Previous Experience & Challenges")}</span>
                  <div className="p-3 bg-red-50/50 rounded-lg border border-red-100/60 text-xs text-red-800 leading-relaxed font-serif-ar">
                    {selected.history || label("لا توجد تفاصيل تعاقدات سابقة", "No historical details")}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Problems faced & Ambitions */}
            <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                {label("5. المشكلات وحلها (الأهداف والطموحات)", "5. Problems & Solutions")}
              </h3>
              <div className="p-4 bg-[#FBF7F0] rounded-xl border border-[#e1dbce] text-sm text-[#0C363A] leading-relaxed font-serif-ar whitespace-pre-line">
                {selected.goals || label("لا توجد تفاصيل مضافة للمشكلات أو الطموحات", "No problem details provided")}
              </div>
            </div>

            {/* Step 6: Notes */}
            {selected.notes && (
              <div className="bg-white rounded-xl p-5 border border-border/80 shadow-sm space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b pb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {label("6. ملاحظات إضافية", "6. Additional Notes")}
                </h3>
                <div className="p-4 bg-yellow-50/30 rounded-xl border border-yellow-100/50 text-sm text-yellow-900 leading-relaxed font-serif-ar whitespace-pre-line">
                  {selected.notes}
                </div>
              </div>
            )}

            {/* Timestamp Footer */}
            <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 pt-4">
              <Clock className="h-3 w-3" />
              <span>{label("تاريخ الاستلام:", "Received on:")}</span>
              <span>{new Date(selected.created_at).toLocaleString(label("ar-EG", "en-US"), { dateStyle: "long", timeStyle: "short" })}</span>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="h-[calc(100vh-220px)] rounded-lg border border-[#e1dbce] bg-white grid place-items-center p-8 text-center text-muted-foreground shadow-sm">
          <div className="space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 animate-pulse" />
            <h3 className="font-semibold text-lg text-[#0C363A]">{label("الرجاء اختيار استبيان", "Please Select a Questionnaire")}</h3>
            <p className="text-sm">{label("اختر استبياناً من القائمة الجانبية لقراءة تفاصيل متطلبات العميل كاملة.", "Choose a submission from the sidebar list to inspect complete details.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
