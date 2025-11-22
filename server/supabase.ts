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

    // Create student_profiles table
    await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS student_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          full_name TEXT,
          email TEXT,
          phone TEXT,
          date_of_birth TEXT,
          address TEXT,
          education TEXT,
          skills TEXT,
          experience TEXT,
          photo_url TEXT,
          profile_data TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `,
    }).catch(() => {
      // Table might already exist
    });

    // Create documents table
    await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          name TEXT NOT NULL,
          type TEXT,
          size TEXT,
          url TEXT,
          uploaded_date TIMESTAMP DEFAULT NOW()
        );
      `,
    }).catch(() => {});

    // Create jobs table
    await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          location TEXT,
          type TEXT,
          category TEXT,
          deadline TEXT,
          description TEXT,
          salary TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,
    }).catch(() => {});

    // Create applications table
    await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          job_id UUID NOT NULL REFERENCES jobs(id),
          status TEXT DEFAULT 'pending',
          applied_date TIMESTAMP DEFAULT NOW()
        );
      `,
    }).catch(() => {});

    console.log("✅ Supabase tables initialized");
  } catch (error) {
    console.error("Error setting up Supabase tables:", error);
  }
}
