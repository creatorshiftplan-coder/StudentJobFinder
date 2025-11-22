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
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error?.code === "PGRST116") {
      const { data: newProfile } = await supabase
        .from("student_profiles")
        .insert({
          user_id: user.id,
          full_name: "",
          email: user.email || "",
        })
        .select()
        .single();
      return new Response(JSON.stringify(newProfile), { headers: { "Content-Type": "application/json" } });
    }

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { data, error } = await supabase
      .from("student_profiles")
      .insert({
        user_id: user.id,
        full_name: body.fullName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.dateOfBirth,
        address: body.address,
        education: body.education,
        skills: body.skills,
        experience: body.experience,
        photo_url: body.photoUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const { id } = new URL(req.url).searchParams;
    
    const { data, error } = await supabase
      .from("student_profiles")
      .update({
        full_name: body.fullName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.dateOfBirth,
        address: body.address,
        education: body.education,
        skills: body.skills,
        experience: body.experience,
        photo_url: body.photoUrl,
        profile_data: body.profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
});
