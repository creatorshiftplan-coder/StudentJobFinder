# Supabase Edge Functions Setup Guide - Linear Workflow

Convert job scraper, OCR extraction, and job tracker into serverless Edge Functions running on Supabase. Follow these exact steps in order.

## Overview

**What we're doing:**
- Moving job scraper from local Express to Supabase Edge Functions (runs on Supabase servers)
- Moving OCR extraction to Edge Function (processes documents serverlessly)
- Creating job tracker Edge Function (application tracking)

**Benefits:**
✅ Serverless (no need to keep Express running)
✅ Auto-scaling (handles traffic automatically)
✅ Cheaper hosting (pay only when functions run)
✅ No cold starts (Supabase optimized)
✅ Direct database access (faster than HTTP)

---

## STEP 1: Install Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (using scoop)
scoop install supabase

# Or use npm
npm install -g supabase
```

---

## STEP 2: Initialize Supabase in Your Project

```bash
cd /home/runner/workspace

# Login to Supabase
supabase login

# When prompted, copy this command into browser to authorize:
# https://supabase.com/dashboard

# After login, initialize
supabase init
```

This creates a `supabase/` folder locally for edge functions.

---

## STEP 3: Create Edge Functions

The three files are already created:
- `supabase/functions/job-scraper/index.ts` ✓
- `supabase/functions/ocr-extract/index.ts` ✓
- `supabase/functions/job-tracker/index.ts` ✓

---

## STEP 4: Deploy Edge Functions to Supabase

```bash
cd /home/runner/workspace

# Deploy all functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy job-scraper
supabase functions deploy ocr-extract
supabase functions deploy job-tracker
```

After deployment, you'll see URLs like:
```
✓ Function deployed: job-scraper
  📍 https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/job-scraper

✓ Function deployed: ocr-extract
  📍 https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/ocr-extract

✓ Function deployed: job-tracker
  📍 https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/job-tracker
```

---

## STEP 5: Add Environment Variables to Supabase

Go to Supabase Dashboard → Your Project → Settings → Functions

Add these secrets:
```
GOOGLE_GENERATIVE_AI_API_KEY = your-gemini-api-key
```

These are automatically inherited from your Replit environment.

---

## STEP 6: Create Database Tables

Go to Supabase Dashboard → SQL Editor and run:

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
  user_id UUID NOT NULL REFERENCES auth.users(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  status TEXT DEFAULT 'pending',
  applied_date TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create student_profiles table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
```

---

## STEP 7: Call Edge Functions from Frontend

### Job Scraper (runs every 5 minutes)

```typescript
// In your component
async function triggerJobScraper() {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-scraper`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }
  );
  const data = await response.json();
  console.log(`✓ ${data.jobsAdded} jobs scraped`);
}
```

### OCR Extract

```typescript
async function extractFromDocument(imageUrl: string, userId: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageUrl, userId })
    }
  );
  const { data: extractedData } = await response.json();
  return extractedData; // { fullName, email, phone, ... }
}
```

### Job Tracker

```typescript
// Apply for a job
async function applyForJob(userId: string, jobId: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-tracker`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "apply",
        userId,
        jobId
      })
    }
  );
  return await response.json();
}

// Get all applications
async function getAllApplications(userId: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-tracker`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "getAll",
        userId
      })
    }
  );
  return await response.json();
}

// Update application status
async function updateApplicationStatus(userId: string, jobId: string, status: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-tracker`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "update",
        userId,
        jobId,
        status
      })
    }
  );
  return await response.json();
}
```

---

## STEP 8: Set Up Scheduler (Optional)

To run job scraper automatically every 5 minutes, use Supabase's `pg_cron` extension:

Go to Supabase Dashboard → SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job scraper to run every 5 minutes
SELECT cron.schedule(
  'job-scraper-5min',
  '*/5 * * * *',
  'SELECT net.http_post(
    ''https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/job-scraper'',
    jsonb_build_object(''method'', ''POST'')
  )'
);
```

Replace the URL with your actual Supabase URL.

---

## STEP 9: Update Frontend Environment Variables

Add to your `.env` file:

```
VITE_SUPABASE_URL=https://cvnalogvvfzapxmozdyh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## STEP 10: Verify Everything Works

```bash
# Test job scraper
curl -X POST https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/job-scraper \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test OCR extract
curl -X POST https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/ocr-extract \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "data:image/jpeg;base64,...", "userId": "user-id"}'

# Test job tracker
curl -X POST https://cvnalogvvfzapxmozdyh.supabase.co/functions/v1/job-tracker \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "getAll", "userId": "user-id"}'
```

---

## TROUBLESHOOTING

**Error: "Function not found"**
- Run `supabase functions deploy` again
- Check the Supabase dashboard for deployment errors

**Error: "Unauthorized"**
- Make sure you're sending a valid Bearer token
- Token must be from authenticated user

**Error: "Database error"**
- Check that tables are created
- Verify GOOGLE_GENERATIVE_AI_API_KEY is set in Supabase secrets

**Error: "CORS"**
- Supabase Edge Functions handle CORS automatically
- Make sure Authorization header is included

---

## QUICK REFERENCE: API ENDPOINTS

| Function | Endpoint | Method |
|----------|----------|--------|
| Job Scraper | `/functions/v1/job-scraper` | POST |
| OCR Extract | `/functions/v1/ocr-extract` | POST |
| Job Tracker | `/functions/v1/job-tracker` | POST |

---

## NEXT: Disable Local Job Scheduler

Once Edge Functions are working, you can disable the local scheduler:

In `server/routes.ts`:
```typescript
// Comment out to use Edge Functions instead
// startJobScheduler();
```

---

## Summary

✅ Three serverless Edge Functions deployed
✅ Database tables created
✅ Job scraper runs automatically every 5 minutes
✅ OCR extracts directly on Supabase servers
✅ Application tracking fully distributed
✅ Zero infrastructure to manage

Your app is now truly serverless! 🚀
