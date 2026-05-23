const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAxMDIsImV4cCI6MjA5NDM4NjEwMn0.DTFqd8GmYBY5rEIfs0SpktgJpo6bcBj9f-RWSHAXXxI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data: sections, error } = await supabase
      .from('cms_sections')
      .select('id, section_key, section_name_ar, title_ar, sort_order')
      .eq('page_slug', 'home')
      .order('sort_order');
    if (error) throw error;
    console.log("HOME SECTIONS IN DB:");
    console.log(JSON.stringify(sections, null, 2));
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspect();
