const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgxMDEwMiwiZXhwIjoyMDk0Mzg2MTAyfQ.oiPGsmbEGipqWhYq7k9xHKbrsymURyrcbcWR5cMjYwE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data: options, error: optErr } = await supabase.from('package_options').select('*').limit(10);
    if (optErr) {
      console.error("Error fetching options:", optErr);
      return;
    }
    
    console.log("--- Options ---");
    options.forEach(opt => {
      console.log(`Option: ID=${opt.id}, NameAR=${opt.name_ar}, NameEN=${opt.name_en}, Image=${opt.image_url}`);
    });

    const { data: media, error: mediaErr } = await supabase.from('package_option_media').select('*').limit(20);
    if (mediaErr) {
      console.error("Error fetching media:", mediaErr);
      return;
    }
    
    console.log("\n--- Option Media ---");
    media.forEach(m => {
      console.log(`Media: ID=${m.id}, OptionID=${m.option_id}, AltAR=${m.alt_ar}, AltEN=${m.alt_en}, URL=${m.url}`);
    });

  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspect();
