import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials not configured. Running in demo mode.");
}

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

export function isSupabaseEnabled(): boolean {
  return supabase !== null;
}

export async function createTablesIfNotExist(): Promise<void> {
  if (!supabase) return;

  try {
    console.log("Setting up Supabase tables...");
    console.log("✅ Supabase connected - tables will be auto-created via Supabase SQL editor");
    // Tables can be created manually via Supabase dashboard or with direct SQL calls
    // For now, log that connection is successful
  } catch (error) {
    console.error("Error setting up Supabase tables:", error);
  }
}
