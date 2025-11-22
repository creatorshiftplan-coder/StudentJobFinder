import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TrackerPayload {
  action: "apply" | "update" | "get" | "getAll";
  userId: string;
  jobId?: string;
  status?: "pending" | "shortlisted" | "rejected" | "selected";
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
  }

  try {
    const payload: TrackerPayload = await req.json();
    const { action, userId, jobId, status } = payload;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), { status: 400 });
    }

    if (action === "apply") {
      if (!jobId) {
        return new Response(JSON.stringify({ error: "jobId required for apply" }), { status: 400 });
      }

      const { data, error } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          job_id: jobId,
          status: "pending",
        })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, application: data[0] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!jobId || !status) {
        return new Response(JSON.stringify({ error: "jobId and status required for update" }), { status: 400 });
      }

      const { data, error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("job_id", jobId)
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, application: data[0] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "get" && jobId) {
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", userId)
        .eq("job_id", jobId)
        .single();

      if (error) return new Response(JSON.stringify({ application: null }), { status: 200 });
      return new Response(JSON.stringify({ success: true, application: data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "getAll") {
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", userId)
        .order("applied_date", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, applications: data || [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
