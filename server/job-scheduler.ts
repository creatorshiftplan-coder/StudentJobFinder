import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import { jobCache } from "./cache";
import robotsParser from "robots-parser";
import type { InsertJob } from "@shared/schema";

// Initialize Gemini AI
function initializeGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set!");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

const genAI = initializeGemini();

// Government recruitment sources
const ALL_SOURCES = [
  { name: "UPSC", baseUrl: "https://www.upsc.gov.in", category: "Administrative / Civil Services" },
  { name: "SSC", baseUrl: "https://www.ssc.nic.in", category: "Central Government" },
  { name: "RRB", baseUrl: "https://www.rrbcdg.gov.in", category: "Railways" },
  { name: "IBPS", baseUrl: "https://www.ibps.in", category: "Banking" },
  { name: "RBI", baseUrl: "https://opportunities.rbi.org.in", category: "Banking" },
  { name: "SBI", baseUrl: "https://sbi.co.in/careers", category: "Banking" },
  { name: "India Post", baseUrl: "https://indiapostgdsonline.gov.in", category: "Central Government" },
  { name: "DRDO", baseUrl: "https://www.drdo.gov.in", category: "Defence" },
  { name: "ISRO", baseUrl: "https://www.isro.gov.in/Careers.html", category: "Defence" },
  { name: "BARC", baseUrl: "https://recruit.barc.gov.in", category: "Defence" },
  { name: "AIIMS", baseUrl: "https://www.aiimsexams.ac.in", category: "Health / Medical" },
  { name: "ESIC", baseUrl: "https://www.esic.nic.in", category: "Health / Medical" },
  { name: "Coal India", baseUrl: "https://coalindia.in/en-us/careers", category: "Public Sector Undertaking (PSU)" },
  { name: "BSNL", baseUrl: "https://www.bsnl.co.in/opportunities", category: "Public Sector Undertaking (PSU)" },
  { name: "LIC", baseUrl: "https://www.licindia.in/careers", category: "Public Sector Undertaking (PSU)" },
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Check robots.txt and return allowed status
async function canScrape(baseUrl: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).href;
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": getRandomUserAgent() },
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, assume scraping is allowed
      return true;
    }

    const robotsTxt = await response.text();
    const robots = robotsParser(robotsUrl, robotsTxt);
    
    // Check if we can fetch the main page
    return robots.isAllowed(baseUrl, "Googlebot") !== false;
  } catch (error) {
    // If we can't reach robots.txt, assume scraping is allowed
    return true;
  }
}

// Fetch with retry logic, timeout, and TLS bypass
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  initialDelay = 2000,
  timeout = 15000
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`[Scheduler] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
          "DNT": "1",
          "Pragma": "no-cache",
        },
      } as any);

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      if (html.length === 0) {
        lastError = new Error("Empty response");
        continue;
      }

      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries - 1) break;
    }
  }

  return null;
}

// AI-powered job extraction from raw HTML
async function extractJobsWithAI(html: string, source: string, category: string): Promise<InsertJob[]> {
  try {
    if (!genAI) {
      console.error(`[Scheduler] Gemini AI not initialized for ${source}`);
      return [];
    }

    console.log(`[Scheduler] Sending ${html.length} bytes to Gemini AI for ${source}...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Extract ALL job postings from this raw HTML content. Return ONLY a valid JSON array.

Return this exact format (return [] if no jobs found):
[
  {
    "title": "Job Title",
    "company": "Company/Organization Name",
    "location": "City/Location",
    "type": "Full-time or Part-time or Contract",
    "deadline": "YYYY-MM-DD (estimate if not clear)",
    "description": "Brief 1-2 sentence job description",
    "salary": "Salary range or 'Varies' or 'Competitive'"
  }
]

Rules:
- Extract EVERY job posting visible on the page
- Parse all text content and HTML structure intelligently
- If dates are unclear, estimate reasonable deadline (30-60 days out)
- If information is missing, use reasonable defaults
- Return ONLY the JSON array, no other text
- Ensure all fields are strings

HTML Content:
${html.substring(0, 12000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response?.text()?.trim() || "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[Scheduler] No JSON found in Gemini response for ${source}`);
      return [];
    }

    let jobs: any[];
    try {
      jobs = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`[Scheduler] Failed to parse JSON for ${source}:`, parseError);
      return [];
    }

    if (!Array.isArray(jobs)) {
      console.log(`[Scheduler] Gemini response is not an array for ${source}`);
      return [];
    }

    // Map to InsertJob format
    const mappedJobs = jobs
      .filter((j: any) => j?.title && j?.company)
      .slice(0, 5) // Limit to 5 jobs per source
      .map((j: any) => ({
        title: String(j.title || "").substring(0, 100).trim(),
        company: String(j.company || "").substring(0, 100).trim(),
        location: String(j.location || source).substring(0, 100).trim(),
        type: String(j.type || "Full-time").substring(0, 50),
        category,
        deadline:
          j.deadline ||
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        description: String(j.description || `Jobs from ${source}`)
          .substring(0, 200)
          .trim(),
        salary: String(j.salary || "Varies").substring(0, 100),
      }));

    console.log(`[Scheduler] ✓ Extracted ${mappedJobs.length} jobs from ${source}`);
    return mappedJobs;
  } catch (error) {
    console.error(
      `[Scheduler] AI extraction error for ${source}:`,
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

let currentSourceIndex = 0;

export async function scrapeNextBatch(): Promise<void> {
  if (!genAI) {
    console.error("[Scheduler] Gemini AI not initialized");
    jobCache.addLog([], 0, "failed", "Gemini AI not initialized");
    return;
  }

  // Get next 5 sources
  const batchSources = ALL_SOURCES.slice(
    currentSourceIndex,
    currentSourceIndex + 5
  );
  const sourceNames = batchSources.map((s) => s.name);

  console.log(
    `\n[Scheduler] ==========================================`
  );
  console.log(
    `[Scheduler] Starting batch ${Math.floor(currentSourceIndex / 5) + 1}: ${sourceNames.join(", ")}`
  );
  console.log(
    `[Scheduler] ==========================================\n`
  );

  let totalJobsAdded = 0;
  let successCount = 0;

  for (const source of batchSources) {
    try {
      // Check robots.txt first
      const allowed = await canScrape(source.baseUrl);
      if (!allowed) {
        console.log(
          `[Scheduler] ⛔ ${source.name} - scraping blocked by robots.txt`
        );
        continue;
      }

      console.log(`[Scheduler] 🔄 Fetching from ${source.name}...`);
      const html = await fetchWithRetry(source.baseUrl);

      if (!html) {
        console.log(
          `[Scheduler] ✗ ${source.name} - failed to fetch after retries`
        );
        continue;
      }

      console.log(`[Scheduler] 📄 Received ${html.length} bytes from ${source.name}`);

      const jobs = await extractJobsWithAI(html, source.name, source.category);

      if (jobs.length > 0) {
        jobCache.addJobs(source.name, jobs);

        // Save to database
        let savedCount = 0;
        for (const job of jobs) {
          try {
            await storage.createJob(job);
            savedCount++;
            totalJobsAdded++;
          } catch (error) {
            // Job might already exist - that's fine
          }
        }

        console.log(
          `[Scheduler] ✅ ${source.name} - ${savedCount}/${jobs.length} jobs added to database`
        );
        successCount++;
      } else {
        console.log(
          `[Scheduler] ⓘ ${source.name} - no jobs found in HTML`
        );
        successCount++;
      }
    } catch (error) {
      console.error(
        `[Scheduler] ❌ ${source.name} - ${error instanceof Error ? error.message : error}`
      );
    }
  }

  // Update index for next batch
  currentSourceIndex = (currentSourceIndex + 5) % ALL_SOURCES.length;

  // Log the scraping operation
  jobCache.addLog(sourceNames, totalJobsAdded, "success");

  console.log(
    `\n[Scheduler] ==========================================`
  );
  console.log(
    `[Scheduler] Batch complete: ${successCount}/${batchSources.length} sources processed`
  );
  console.log(`[Scheduler] Total jobs added: ${totalJobsAdded}`);
  console.log(
    `[Scheduler] Next batch in 5 minutes...`
  );
  console.log(
    `[Scheduler] ==========================================\n`
  );
}

export function startJobScheduler(): void {
  console.log(
    "[Scheduler] ✨ AI-Powered Job Scheduler Started"
  );
  console.log(
    "[Scheduler] Strategy: Fetch HTML → AI Extract → Gemini Parse"
  );
  console.log("[Scheduler] Updates every 5 minutes (top 5 sites per batch)\n");

  // Run immediately on startup
  scrapeNextBatch().catch(console.error);

  // Run every 5 minutes (300000 ms)
  setInterval(() => {
    scrapeNextBatch().catch(console.error);
  }, 5 * 60 * 1000);
}
