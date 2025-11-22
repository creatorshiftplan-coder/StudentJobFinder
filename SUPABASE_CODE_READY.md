# Copy-Paste Ready Code for Supabase Dashboard

## SQL CODE - Run in SQL Editor

Copy all this into Supabase Dashboard → SQL Editor → Run

```sql
-- Create jobs table
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

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  applied_date TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);

-- Enable RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs (public read)
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

-- Create policies for applications (user specific)
CREATE POLICY "Applications are viewable by owner" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Applications can be created by user" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applications can be updated by owner" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for student_profiles (user specific)
CREATE POLICY "Profiles are viewable by owner" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Profiles can be created by user" ON student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles can be updated by owner" ON student_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## EDGE FUNCTION CODE

### 1. Job Scraper Function

**In Supabase Dashboard → Functions → Create New Function → Name: `job-scraper`**

Paste this code:

```typescript
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract ALL job postings from this HTML. Return ONLY a valid JSON array of jobs with title, company, location, type, deadline, description, salary:\n\n${html.substring(0, 8000)}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const jobs: Job[] = JSON.parse(jsonMatch[0]);
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
      try {
        const html = await fetch(source.baseUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
        })
          .then((r) => r.text())
          .catch(() => "");

        if (!html) continue;

        const jobs = await extractJobsWithAI(html, source.name, source.category);

        for (const job of jobs) {
          try {
            await supabase.from("jobs").insert(job);
            totalJobs++;
          } catch {
            // Job might already exist
          }
        }

        console.log(`✓ ${source.name}: ${jobs.length} jobs added`);
      } catch (sourceError) {
        console.error(`Error processing ${source.name}:`, sourceError);
      }
    }

    return new Response(JSON.stringify({ success: true, jobsAdded: totalJobs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

### 2. OCR Extract Function

**In Supabase Dashboard → Functions → Create New Function → Name: `ocr-extract`**

Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OCRResult {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  address?: string;
  education?: string;
  [key: string]: string | undefined;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
  }

  try {
    const { imageUrl, userId } = await req.json();

    if (!imageUrl || !userId) {
      return new Response(JSON.stringify({ error: "imageUrl and userId required" }), { status: 400 });
    }

    const base64Data = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data,
                  },
                },
                {
                  text: `Extract all personal information from this document. Return ONLY JSON with fields: fullName, email, mobileNumber, dateOfBirth, address, education. Omit fields not found.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "No data extracted" }), { status: 400 });
    }

    const extractedData: OCRResult = JSON.parse(jsonMatch[0]);

    if (extractedData.fullName || extractedData.email) {
      await supabase
        .from("student_profiles")
        .update({
          full_name: extractedData.fullName,
          email: extractedData.email,
          phone: extractedData.mobileNumber,
          date_of_birth: extractedData.dateOfBirth,
          address: extractedData.address,
          education: extractedData.education,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

### 3. Job Tracker Function

**In Supabase Dashboard → Functions → Create New Function → Name: `job-tracker`**

Paste this code:

```typescript
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
        return new Response(JSON.stringify({ error: "jobId required" }), { status: 400 });
      }

      const { data, error } = await supabase
        .from("applications")
        .insert({ user_id: userId, job_id: jobId, status: "pending" })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, application: data[0] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!jobId || !status) {
        return new Response(JSON.stringify({ error: "jobId and status required" }), { status: 400 });
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
```

---

## SETUP STEPS (10 minutes)

1. **Create Tables**: Copy SQL code above → Supabase Dashboard → SQL Editor → Paste → Run

2. **Create Functions**:
   - Go to Supabase Dashboard → Functions → Create New Function
   - Name it (e.g., `job-scraper`)
   - Delete existing code, paste the function code above
   - Click "Deploy"
   - Repeat for all 3 functions

3. **Add Environment Variable**:
   - Settings → Functions → Environment Variables
   - Add: `GOOGLE_GENERATIVE_AI_API_KEY` = your-gemini-key

4. **Test Functions** (in browser console):

```javascript
// Test Job Scraper
fetch('https://your-project.supabase.co/functions/v1/job-scraper', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log);

// Test OCR
fetch('https://your-project.supabase.co/functions/v1/ocr-extract', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({ imageUrl: 'data:image/jpeg;base64,...', userId: 'user-id' })
}).then(r => r.json()).then(console.log);

// Test Job Tracker
fetch('https://your-project.supabase.co/functions/v1/job-tracker', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({ action: 'getAll', userId: 'user-id' })
}).then(r => r.json()).then(console.log);
```

Done! All 3 edge functions + database ready to use. 🚀
