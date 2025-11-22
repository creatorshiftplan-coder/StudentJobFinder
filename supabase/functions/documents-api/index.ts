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

  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        size: body.size,
        url: body.url,
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "DELETE") {
    const id = pathname.split("/").pop();
    const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", user.id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
});
