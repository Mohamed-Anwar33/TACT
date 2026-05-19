import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type ClientReviewSubmission = {
  name: string;
  role?: string;
  quote: string;
  rating: number;
};

export async function submitClientReview(input: ClientReviewSubmission) {
  const role = input.role?.trim() || "Tact Client";
  const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));

  const { error } = await db.from("cms_client_testimonials").insert({
    client_name_ar: input.name.trim(),
    client_name_en: input.name.trim(),
    role_ar: role,
    role_en: role,
    quote_ar: input.quote.trim(),
    quote_en: input.quote.trim(),
    rating,
    image_url: null,
    video_url: null,
    video_cover_url: null,
    visible: false,
    sort_order: 0,
  });

  if (error) throw error;
}
