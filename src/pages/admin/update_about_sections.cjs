const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAxMDIsImV4cCI6MjA5NDM4NjEwMn0.DTFqd8GmYBY5rEIfs0SpktgJpo6bcBj9f-RWSHAXXxI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log("Starting About page sections update in Supabase...");

    // Update Hero section
    const { error: heroErr } = await supabase
      .from('cms_sections')
      .update({
        title_ar: "هندسة المعنى داخل كل مساحة",
        title_en: "Engineering meaning into every space",
        body_ar: "من نحن",
        body_en: "About"
      })
      .eq('page_slug', 'about')
      .eq('section_key', 'hero');
    if (heroErr) console.error("Error updating hero:", heroErr);
    else console.log("✓ Hero section successfully updated!");

    // Update Intro section (set quote in cta_label fields)
    const { error: introErr } = await supabase
      .from('cms_sections')
      .update({
        cta_label_ar: "نؤمن أن المساحة قصة، وأن التنفيذ هو الفصل الذي يجعلها حقيقية.",
        cta_label_en: "A space is a story; execution is the chapter that makes it real."
      })
      .eq('page_slug', 'about')
      .eq('section_key', 'intro');
    if (introErr) console.error("Error updating intro quote:", introErr);
    else console.log("✓ Intro section quote successfully updated!");

    // Update Process section
    const { error: procErr } = await supabase
      .from('cms_sections')
      .update({
        body_ar: "رحلتنا",
        body_en: "Our Process"
      })
      .eq('page_slug', 'about')
      .eq('section_key', 'process');
    if (procErr) console.error("Error updating process eyebrow:", procErr);
    else console.log("✓ Process section successfully updated!");

    // Update Values section
    const { error: valErr } = await supabase
      .from('cms_sections')
      .update({
        body_ar: "قيمنا",
        body_en: "Our Values"
      })
      .eq('page_slug', 'about')
      .eq('section_key', 'values');
    if (valErr) console.error("Error updating values eyebrow:", valErr);
    else console.log("✓ Values section successfully updated!");

    console.log("All updates completed.");
  } catch (err) {
    console.error("Critical error running script:", err);
  }
}

run();
