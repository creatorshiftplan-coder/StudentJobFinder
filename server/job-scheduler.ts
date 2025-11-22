import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import { jobCache } from "./cache";
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

// All government sources
const ALL_SOURCES = [
  { name: "UPSC", url: "https://www.upsc.gov.in", category: "Administrative / Civil Services" },
  { name: "SSC", url: "https://www.ssc.nic.in", category: "Central Government" },
  { name: "RRB", url: "https://www.rrbcdg.gov.in", category: "Railways" },
  { name: "IBPS", url: "https://www.ibps.in", category: "Banking" },
  { name: "RBI", url: "https://opportunities.rbi.org.in", category: "Banking" },
  { name: "SBI", url: "https://sbi.co.in/careers", category: "Banking" },
  { name: "India Post", url: "https://indiapostgdsonline.gov.in", category: "Central Government" },
  { name: "DRDO", url: "https://www.drdo.gov.in", category: "Defence" },
  { name: "ISRO", url: "https://www.isro.gov.in/Careers.html", category: "Defence" },
  { name: "BARC", url: "https://recruit.barc.gov.in", category: "Defence" },
  { name: "AIIMS", url: "https://www.aiimsexams.ac.in", category: "Health / Medical" },
  { name: "ESIC", url: "https://www.esic.nic.in", category: "Health / Medical" },
  { name: "Coal India", url: "https://coalindia.in/en-us/careers", category: "Public Sector Undertaking (PSU)" },
  { name: "BSNL", url: "https://www.bsnl.co.in/opportunities", category: "Public Sector Undertaking (PSU)" },
  { name: "LIC", url: "https://www.licindia.in/careers", category: "Public Sector Undertaking (PSU)" },
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchWithTimeout(url: string, timeout = 12000): Promise<string | null> {
  try {
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
      },
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.log(`[Scheduler] Fetch error for ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function extractJobsWithAI(html: string, source: string, category: string): Promise<InsertJob[]> {
  try {
    if (!genAI) return [];

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Extract job listings from HTML (return ONLY JSON array, no other text):
[{"title":"...", "company":"...", "location":"...", "type":"Full-time", "deadline":"YYYY-MM-DD", "description":"...", "salary":"..."}]
If no jobs, return []
HTML: ${html.substring(0, 5000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response?.text()?.trim() || "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const jobs = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(jobs)) return [];

    return jobs
      .filter((j: any) => j?.title && j?.company)
      .slice(0, 3)
      .map((j: any) => ({
        title: String(j.title).substring(0, 100),
        company: String(j.company).substring(0, 100),
        location: String(j.location || source).substring(0, 100),
        type: String(j.type || "Full-time"),
        category,
        deadline: j.deadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: String(j.description || `Jobs from ${source}`).substring(0, 200),
        salary: String(j.salary || "Varies"),
      }));
  } catch (error) {
    console.error(`AI extraction failed for ${source}:`, error);
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
  const batchSources = ALL_SOURCES.slice(currentSourceIndex, currentSourceIndex + 5);
  const sourceNames = batchSources.map((s) => s.name);

  console.log(`[Scheduler] Scraping batch ${Math.floor(currentSourceIndex / 5) + 1}: ${sourceNames.join(", ")}`);

  let totalJobsAdded = 0;

  for (const source of batchSources) {
    try {
      const html = await fetchWithTimeout(source.url);
      if (!html) {
        console.log(`[Scheduler] ✗ ${source.name} - fetch failed`);
        continue;
      }

      const jobs = await extractJobsWithAI(html, source.name, source.category);
      if (jobs.length > 0) {
        jobCache.addJobs(source.name, jobs);

        // Also save to storage
        for (const job of jobs) {
          try {
            await storage.createJob(job);
            totalJobsAdded++;
          } catch {
            // Job might already exist
          }
        }

        console.log(`[Scheduler] ✓ ${source.name} - ${jobs.length} jobs added`);
      } else {
        console.log(`[Scheduler] ✓ ${source.name} - 0 jobs found`);
      }
    } catch (error) {
      console.error(`[Scheduler] ✗ ${source.name} - ${error}`);
    }
  }

  // Update index for next batch
  currentSourceIndex = (currentSourceIndex + 5) % ALL_SOURCES.length;

  // Log the scraping operation
  jobCache.addLog(sourceNames, totalJobsAdded, "success");
  console.log(`[Scheduler] Batch complete. Total jobs added: ${totalJobsAdded}. Next batch starts in 5 minutes.`);
}

export function startJobScheduler(): void {
  console.log("[Scheduler] Job scheduler started - will scrape top 5 govt sites every 5 minutes");

  // Run immediately on startup
  scrapeNextBatch().catch(console.error);

  // Run every 5 minutes (300000 ms)
  setInterval(() => {
    scrapeNextBatch().catch(console.error);
  }, 5 * 60 * 1000);
}
