import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const { authorization } = req.headers;
  if (!authorization?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const token = authorization.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: body.jobId,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const { data, error } = await supabase
      .from("applications")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("job_id", body.jobId)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
});
