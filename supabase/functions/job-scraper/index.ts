import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Job {
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  deadline: string;
  description: string;
  salary: string;
}

const ALL_SOURCES = [
  { name: "UPSC", baseUrl: "https://www.upsc.gov.in", category: "Administrative / Civil Services" },
  { name: "SSC", baseUrl: "https://www.ssc.nic.in", category: "Central Government" },
  { name: "RRB", baseUrl: "https://www.rrbcdg.gov.in", category: "Railways" },
  { name: "IBPS", baseUrl: "https://www.ibps.in", category: "Banking" },
  { name: "RBI", baseUrl: "https://opportunities.rbi.org.in", category: "Banking" },
];

async function extractJobsWithAI(html: string, source: string, category: string): Promise<Job[]> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract ALL job postings from this HTML. Return ONLY a valid JSON array:\n\nHTML:\n${html.substring(0, 8000)}`
          }]
        }]
      })
    });

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    let jobs: Job[] = JSON.parse(jsonMatch[0]);
    return jobs
      .filter((j: any) => j?.title && j?.company)
      .slice(0, 5)
      .map((j: any) => ({
        title: String(j.title).substring(0, 100),
        company: String(j.company).substring(0, 100),
        location: String(j.location || source).substring(0, 100),
        type: String(j.type || "Full-time").substring(0, 50),
        category,
        deadline: j.deadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: String(j.description || "").substring(0, 200),
        salary: String(j.salary || "Varies").substring(0, 100),
      }));
  } catch (error) {
    console.error("AI extraction error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
  }

  try {
    let totalJobs = 0;

    for (const source of ALL_SOURCES) {
      const html = await fetch(source.baseUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }).then(r => r.text()).catch(() => "");

      if (!html) continue;

      const jobs = await extractJobsWithAI(html, source.name, source.category);

      for (const job of jobs) {
        await supabase.from("jobs").insert(job).catch(() => {});
        totalJobs++;
      }

      console.log(`✓ ${source.name}: ${jobs.length} jobs added`);
    }

    return new Response(JSON.stringify({ success: true, jobsAdded: totalJobs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
