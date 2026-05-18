const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAxMDIsImV4cCI6MjA5NDM4NjEwMn0.DTFqd8GmYBY5rEIfs0SpktgJpo6bcBj9f-RWSHAXXxI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectReviews() {
  try {
    const { data: reviews, error } = await supabase.from('cms_client_testimonials').select('id, client_name_ar, quote_ar').order('client_name_ar');
    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }
    console.log("TOTAL TESTIMONIALS IN DB:", reviews.length);
    console.log("REVIEWS:");
    reviews.forEach((r, idx) => {
      console.log(`${idx + 1}. ID: ${r.id} | Name: ${r.client_name_ar} | Quote snippet: ${r.quote_ar?.substring(0, 30)}...`);
    });
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspectReviews();
