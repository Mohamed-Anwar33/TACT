const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgxMDEwMiwiZXhwIjoyMDk0Mzg2MTAyfQ.oiPGsmbEGipqWhYq7k9xHKbrsymURyrcbcWR5cMjYwE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteBrochures() {
  try {
    console.log("Deleting 'pdf-booklets' from 'cms_sections'...");
    
    // First, let's delete media related to this section if any to avoid constraints, or cascade
    const { data: section } = await supabase
      .from('cms_sections')
      .select('id')
      .eq('section_key', 'pdf-booklets')
      .single();

    if (section) {
      console.log("Found section ID:", section.id);
      const { error: mediaErr } = await supabase
        .from('cms_section_media')
        .delete()
        .eq('section_id', section.id);
      if (mediaErr) console.warn("Media deletion warning:", mediaErr);
    }

    const { data, error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('section_key', 'pdf-booklets');

    if (error) {
      throw error;
    }
    console.log("Deletion complete! Result:", data);
  } catch (err) {
    console.error("Error deleting section:", err);
  }
}

deleteBrochures();
