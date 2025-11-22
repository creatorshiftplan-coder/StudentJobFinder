# 🚀 Manual Edge Functions Deployment Guide - Browser Dashboard

Follow these exact steps to deploy all 7 edge functions using Supabase Dashboard in your browser.

---

## STEP 1: Access Supabase Dashboard

1. Go to: https://app.supabase.com
2. Login with your account
3. Select project: **job-assist-replit**
4. Click **Functions** in left sidebar (under Edge Functions)

---

## STEP 2: Create First Function - JOB SCRAPER

### 2.1: Create Function
- Click **"Create a new function"** button
- Name: `job-scraper`
- Leave region as default
- Click **"Create function"**

### 2.2: Copy Code
- Delete all existing code in the editor
- Copy and paste this code:

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
          contents: [{
            parts: [{
              text: `Extract ALL job postings from this HTML. Return ONLY a valid JSON array with fields: title, company, location, type, deadline, description, salary:\n\n${html.substring(0, 8000)}`,
            }],
          }],
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

### 2.3: Deploy
- Click **"Deploy"** button (bottom right)
- Wait for confirmation: "Function deployed successfully"

---

## STEP 3: Create Second Function - OCR EXTRACT

### 3.1: Create Function
- Click **"Create a new function"** button
- Name: `ocr-extract`
- Click **"Create function"**

### 3.2: Copy Code
- Delete existing code
- Paste this code:

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
          contents: [{
            parts: [{
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            }, {
              text: `Extract all personal information from this document. Return ONLY JSON with fields: fullName, email, mobileNumber, dateOfBirth, address, education. Omit fields not found.`,
            }],
          }],
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

### 3.3: Deploy
- Click **"Deploy"**
- Wait for confirmation

---

## STEP 4: Create Third Function - JOB TRACKER

### 4.1: Create Function
- Click **"Create a new function"**
- Name: `job-tracker`
- Click **"Create function"**

### 4.2: Copy Code
- Delete existing code
- Paste this code:

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

### 4.3: Deploy
- Click **"Deploy"**

---

## STEP 5: Create Fourth Function - PROFILE

### 5.1: Create Function
- Click **"Create a new function"**
- Name: `profile`
- Click **"Create function"**

### 5.2: Copy Code
- Delete existing code
- Paste this code:

```typescript
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
        .insert({ user_id: user.id, full_name: "", email: user.email || "" })
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
```

### 5.3: Deploy
- Click **"Deploy"**

---

## STEP 6: Create Fifth Function - JOBS-API

### 6.1: Create Function
- Click **"Create a new function"**
- Name: `jobs-api`
- Click **"Create function"**

### 6.2: Copy Code
- Delete existing code
- Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");
  const type = url.searchParams.get("type");

  let query = supabase.from("jobs").select("*");

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json" } });
});
```

### 6.3: Deploy
- Click **"Deploy"**

---

## STEP 7: Create Sixth Function - DOCUMENTS-API

### 7.1: Create Function
- Click **"Create a new function"**
- Name: `documents-api`
- Click **"Create function"**

### 7.2: Copy Code
- Delete existing code
- Paste this code:

```typescript
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
```

### 7.3: Deploy
- Click **"Deploy"**

---

## STEP 8: Create Seventh Function - APPLICATIONS-API

### 8.1: Create Function
- Click **"Create a new function"**
- Name: `applications-api`
- Click **"Create function"**

### 8.2: Copy Code
- Delete existing code
- Paste this code:

```typescript
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
```

### 8.3: Deploy
- Click **"Deploy"**

---

## STEP 9: Verify All Functions Deployed

In Supabase Dashboard → Functions, you should see all 7 functions:

✅ job-scraper
✅ ocr-extract
✅ job-tracker
✅ profile
✅ jobs-api
✅ documents-api
✅ applications-api

All showing **"Created successfully"**

---

## STEP 10: Test Each Function

Go to each function and click **"Test the function"** button to verify they work.

---

## ✅ COMPLETE

All 7 edge functions are now deployed and live on Supabase! Your backend is 100% serverless.
