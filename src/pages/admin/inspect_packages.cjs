const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAxMDIsImV4cCI6MjA5NDM4NjEwMn0.DTFqd8GmYBY5rEIfs0SpktgJpo6bcBj9f-RWSHAXXxI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data: pkgs, error } = await supabase.from('packages').select('*');
    if (error) {
      console.error("Error fetching packages:", error);
    } else {
      console.log("Packages count:", pkgs.length);
      console.log("Packages details:", JSON.stringify(pkgs, null, 2));
    }
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspect();
