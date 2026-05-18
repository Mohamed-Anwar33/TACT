import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QrCode } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import MediaUploader from "@/components/admin/MediaUploader";
import SaveButton from "@/components/admin/SaveButton";
import MediaPreview from "@/components/admin/MediaPreview";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export default function SettingsPage() {
  const [form, setForm] = useState({
    id: "",
    label_ar: "إنستاباي",
    label_en: "InstaPay",
    phone: "",
    ipa: "",
    qr_url: "",
    active: true,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await db
      .from("payment_methods")
      .select("*")
      .eq("type", "instapay")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setForm({
        id: data.id,
        label_ar: data.label_ar || "إنستاباي",
        label_en: data.label_en || "InstaPay",
        phone: data.phone || "",
        ipa: data.ipa || "",
        qr_url: data.qr_url || "",
        active: data.active ?? true,
      });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        id: form.id || undefined,
        type: "instapay",
        label_ar: form.label_ar || "إنستاباي",
        label_en: form.label_en || "InstaPay",
        phone: form.phone || null,
        ipa: form.ipa || null,
        qr_url: form.qr_url || null,
        account_name: null,
        account_number: null,
        instructions_ar: null,
        instructions_en: null,
        sort_order: 1,
        active: form.active,
      };
      const { data, error } = await db
        .from("payment_methods")
        .upsert(payload)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (data?.id) setForm((current) => ({ ...current, id: data.id }));
      toast.success("تم حفظ إعدادات الدفع");
    } catch (err: any) {
      toast.error(err.message || "تعذر حفظ إعدادات الدفع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminHeader title="الإعدادات" subtitle="إعدادات الدفع وQR كود التحويل" previewUrl="/payment" />
      <div className="admin-content">
        <div className="admin-card">
          <div className="card-header">
            <h3><QrCode size={16} style={{ verticalAlign: -2, marginInlineEnd: 6 }} />إعدادات إنستاباي</h3>
          </div>
          <div className="card-body">
            <form onSubmit={save} style={{ display: "grid", gap: "1.25rem", maxWidth: 760 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)", gap: "1.25rem", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label>اسم وسيلة الدفع</label>
                    <Input value={form.label_ar} onChange={e => setForm({ ...form, label_ar: e.target.value })} placeholder="إنستاباي" />
                  </div>
                  <div className="form-group">
                    <label>رقم التحويل أو معرف إنستاباي</label>
                    <Input value={form.phone || form.ipa} onChange={e => setForm({ ...form, phone: e.target.value, ipa: e.target.value })} placeholder="01000000000 أو name@instapay" dir="ltr" />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#0C363A", fontWeight: 700 }}>
                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                    إظهار QR كود الدفع في صفحة الدفع
                  </label>
                  <div className="form-group">
                    <label>رفع صورة QR كود</label>
                    <MediaUploader
                      folder="payment-qr"
                      label="رفع صورة QR كود الدفع"
                      accept="image/*"
                      onUploaded={(url) => setForm((current) => ({ ...current, qr_url: url }))}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", color: "#786f63", fontWeight: 700, marginBottom: 8 }}>المعاينة الحالية</div>
                  {form.qr_url ? (
                    <MediaPreview url={form.qr_url} type="image" />
                  ) : (
                    <div style={{ aspectRatio: "1", borderRadius: 8, border: "1px dashed #d8d0c1", display: "grid", placeItems: "center", color: "#9b9285", background: "#faf8f4", textAlign: "center", padding: "1rem", fontSize: "0.82rem" }}>
                      لا توجد صورة QR مرفوعة
                    </div>
                  )}
                  {form.qr_url && (
                    <button type="button" onClick={() => setForm({ ...form, qr_url: "" })} style={{ marginTop: 10, width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>
                      إزالة الصورة
                    </button>
                  )}
                </div>
              </div>

              <div>
                <SaveButton loading={busy} label="حفظ إعدادات الدفع" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
