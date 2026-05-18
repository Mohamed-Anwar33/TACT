const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lnzxissivnzpjvvxulvc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuenhpc3Npdm56cGp2dnh1bHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAxMDIsImV4cCI6MjA5NDM4NjEwMn0.DTFqd8GmYBY5rEIfs0SpktgJpo6bcBj9f-RWSHAXXxI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data: projects, error: err1 } = await supabase.from('cms_projects').select('*').limit(1);
    const { data: team, error: err2 } = await supabase.from('cms_team_members').select('*').limit(1);
    const { data: reviews, error: err3 } = await supabase.from('cms_client_testimonials').select('*').limit(1);

    console.log("PROJECTS ROW KEYS:", projects && projects.length ? Object.keys(projects[0]) : "Empty table or error: " + JSON.stringify(err1));
    console.log("TEAM MEMBERS ROW KEYS:", team && team.length ? Object.keys(team[0]) : "Empty table or error: " + JSON.stringify(err2));
    console.log("TESTIMONIALS ROW KEYS:", reviews && reviews.length ? Object.keys(reviews[0]) : "Empty table or error: " + JSON.stringify(err3));
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspect();
