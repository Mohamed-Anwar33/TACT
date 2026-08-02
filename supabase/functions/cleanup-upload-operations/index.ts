import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cleanupSecret = Deno.env.get("UPLOAD_CLEANUP_SECRET");

Deno.serve(async (request) => {
  if (!cleanupSecret) {
    return new Response("Cleanup secret is not configured", { status: 503 });
  }
  if (request.headers.get("x-upload-cleanup-secret") !== cleanupSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: operations, error } = await admin
    .from("upload_operations")
    .select("id, storage_path, status, cleanup_attempts")
    .in("status", ["pending", "storage_uploaded", "orphaned"])
    .lt("created_at", cutoff)
    .lt("cleanup_attempts", 3)
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const operation of operations ?? []) {
    // Claim the record before touching Storage so two scheduled invocations do
    // not clean the same object concurrently.
    const { data: claimed } = await admin
      .from("upload_operations")
      .update({ status: "orphaned", cleanup_attempts: operation.cleanup_attempts + 1, cleanup_started_at: new Date().toISOString() })
      .eq("id", operation.id)
      .eq("cleanup_attempts", operation.cleanup_attempts)
      .in("status", ["pending", "storage_uploaded", "orphaned"])
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const { error: removeError } = await admin.storage.from("client-project-media").remove([operation.storage_path]);
    if (removeError) {
      const finalAttempt = operation.cleanup_attempts + 1 >= 3;
      await admin.from("upload_operations").update({
        status: finalAttempt ? "cleanup_failed" : "orphaned",
        cleanup_last_error: removeError.message,
        cleanup_started_at: null,
      }).eq("id", operation.id);
      results.push({ id: operation.id, status: finalAttempt ? "cleanup_failed" : "retry" });
      continue;
    }
    await admin.from("upload_operations").update({ status: "cleaned", cleanup_started_at: null, cleanup_last_error: null }).eq("id", operation.id);
    results.push({ id: operation.id, status: "cleaned" });
  }
  return Response.json({ processed: results });
});
