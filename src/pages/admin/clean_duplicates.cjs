const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
// Using the service role key to bypass RLS policies
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgxMDEwMiwiZXhwIjoyMDk0Mzg2MTAyfQ.oiPGsmbEGipqWhYq7k9xHKbrsymURyrcbcWR5cMjYwE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
  try {
    const { data: reviews, error } = await supabase.from('cms_client_testimonials').select('id, client_name_ar, quote_ar');
    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }
    
    console.log("Original review count in DB:", reviews.length);
    
    const seenQuotes = new Set();
    const idsToDelete = [];
    
    for (const r of reviews) {
      const normalizedQuote = r.quote_ar?.trim();
      if (seenQuotes.has(normalizedQuote)) {
        idsToDelete.push(r.id);
      } else {
        seenQuotes.add(normalizedQuote);
      }
    }
    
    console.log("Identified duplicate IDs to delete:", idsToDelete);
    
    if (idsToDelete.length > 0) {
      for (const id of idsToDelete) {
        const res = await supabase.from('cms_client_testimonials').delete().eq('id', id);
        console.log(`Delete ID: ${id} | Error:`, res.error, `| Status:`, res.status);
      }
      console.log("De-duplication completed!");
    } else {
      console.log("No duplicate rows found!");
    }

    // Wait a brief second to let DB changes settle, then query again
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { data: finalReviews } = await supabase.from('cms_client_testimonials').select('id');
    console.log("Final review count in DB:", finalReviews ? finalReviews.length : 0);
    
  } catch (err) {
    console.error("Error running cleanup:", err);
  }
}

cleanDuplicates();
