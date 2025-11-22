import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import type { InsertJob } from "@shared/schema";

// Initialize Gemini AI - with validation
function initializeGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set!");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

const genAI = initializeGemini();

// Official government recruitment sources
const OFFICIAL_SOURCES = {
  central: [
    { name: "UPSC", url: "https://www.upsc.gov.in", type: "UPSC Exams" },
    { name: "SSC", url: "https://www.ssc.nic.in", type: "SSC Exams" },
    { name: "RRB", url: "https://www.rrbcdg.gov.in", type: "Railway Jobs" },
    { name: "IBPS", url: "https://www.ibps.in", type: "Banking Jobs" },
    { name: "RBI", url: "https://opportunities.rbi.org.in", type: "RBI Jobs" },
    { name: "SBI", url: "https://sbi.co.in/careers", type: "Banking Jobs" },
    {
      name: "India Post",
      url: "https://indiapostgdsonline.gov.in",
      type: "Postal Jobs",
    },
    { name: "DRDO", url: "https://www.drdo.gov.in", type: "Defence Jobs" },
    { name: "ISRO", url: "https://www.isro.gov.in/Careers.html", type: "Space Jobs" },
    { name: "BARC", url: "https://recruit.barc.gov.in", type: "Atomic Jobs" },
    { name: "AIIMS", url: "https://www.aiimsexams.ac.in", type: "Medical Jobs" },
    { name: "ESIC", url: "https://www.esic.nic.in", type: "Labour Jobs" },
    { name: "Coal India", url: "https://coalindia.in/en-us/careers", type: "Coal Jobs" },
    { name: "BSNL", url: "https://www.bsnl.co.in/opportunities", type: "Telecom Jobs" },
    { name: "LIC", url: "https://www.licindia.in/careers", type: "Insurance Jobs" },
    { name: "UCIL", url: "https://ucil.gov.in/job.html", type: "Uranium Jobs" },
    { name: "AAI", url: "https://www.aai.aero/en/careers", type: "Aviation Jobs" },
    { name: "NTPC", url: "https://www.ntpc.co.in/en/careers", type: "Power Jobs" },
    { name: "BHEL", url: "https://www.bhel.com/careers/current-openings", type: "Power Jobs" },
    { name: "HPCL", url: "https://www.hpclcareers.com", type: "Oil Jobs" },
  ],
  states: [
    { name: "West Bengal PSC", url: "https://wbpsc.gov.in", state: "West Bengal" },
    { name: "Uttar Pradesh PSC", url: "https://uppsc.up.nic.in", state: "Uttar Pradesh" },
    { name: "Bihar PSC", url: "https://bpsc.bih.nic.in", state: "Bihar" },
    { name: "Rajasthan PSC", url: "https://rpsc.rajasthan.gov.in", state: "Rajasthan" },
    { name: "Maharashtra PSC", url: "https://mpsc.gov.in", state: "Maharashtra" },
    { name: "Gujarat PSC", url: "https://gpsc.gujarat.gov.in", state: "Gujarat" },
    { name: "Tamil Nadu PSC", url: "https://www.tnpsc.gov.in", state: "Tamil Nadu" },
    { name: "Karnataka PSC", url: "https://www.kpsc.kar.nic.in", state: "Karnataka" },
    { name: "Telangana PSC", url: "https://www.tspsc.gov.in", state: "Telangana" },
    { name: "Andhra Pradesh PSC", url: "https://psc.ap.gov.in", state: "Andhra Pradesh" },
  ],
};

// User agents to rotate and spoof
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// Get random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Retry with exponential backoff
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  initialDelay = 1000
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add delay between retries
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, initialDelay * Math.pow(2, attempt - 1))
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": getRandomUserAgent(),
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries - 1) break;
    }
  }

  throw lastError || new Error("Failed to fetch after retries");
}

// Map sources to job categories
function getCategoryForSource(source: string): string {
  const categoryMap: Record<string, string> = {
    UPSC: "Administrative / Civil Services",
    SSC: "Central Government",
    RRB: "Railways",
    IBPS: "Banking",
    RBI: "Banking",
    SBI: "Banking",
    "India Post": "Central Government",
    DRDO: "Defence",
    ISRO: "Defence",
    BARC: "Defence",
    AIIMS: "Health / Medical",
    ESIC: "Health / Medical",
    "Coal India": "Public Sector Undertaking (PSU)",
    BSNL: "Public Sector Undertaking (PSU)",
    LIC: "Public Sector Undertaking (PSU)",
    UCIL: "Public Sector Undertaking (PSU)",
    AAI: "Public Sector Undertaking (PSU)",
    NTPC: "Public Sector Undertaking (PSU)",
    BHEL: "Public Sector Undertaking (PSU)",
    HPCL: "Public Sector Undertaking (PSU)",
  };
  return categoryMap[source] || "State Government";
}

// Extract jobs using Gemini AI
async function extractJobsWithAI(htmlContent: string, source: string): Promise<InsertJob[]> {
  try {
    if (!genAI) {
      console.error("Gemini AI not initialized - API key missing");
      return [];
    }

    console.log(`Extracting jobs from ${source} using Gemini AI...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Extract job listings from the following HTML content. Return ONLY a valid JSON array with no other text. Each job object must have these fields:
- title: Job title (string)
- company: Company/Organization name (string)
- location: Job location (string)
- type: Job type like "Full-time" or "Part-time" (string)
- deadline: Application deadline in YYYY-MM-DD format (string, estimate if not found)
- description: Brief job description, max 200 characters (string)
- salary: Salary range or "Varies" (string)

If no jobs found, return empty array [].

HTML Content (first 8000 chars):
${htmlContent.substring(0, 8000)}`;

    const result = await model.generateContent(prompt);
    
    if (!result.response || !result.response.text) {
      console.warn(`Empty response from Gemini for ${source}`);
      return [];
    }

    const responseText = result.response.text().trim();
    console.log(`Gemini response for ${source}: ${responseText.substring(0, 100)}...`);

    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(`No JSON array found in Gemini response for ${source}`);
      return [];
    }

    let extractedJobs: any[];
    try {
      extractedJobs = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`Failed to parse JSON from ${source}:`, parseError);
      return [];
    }

    if (!Array.isArray(extractedJobs)) {
      console.warn(`Gemini response for ${source} is not an array`);
      return [];
    }

    const category = getCategoryForSource(source);

    // Map to InsertJob format
    const mappedJobs = extractedJobs
      .filter((job: any) => job && job.title && job.company)
      .slice(0, 5)
      .map((job: any) => ({
        title: String(job.title || "").substring(0, 100),
        company: String(job.company || "").substring(0, 100),
        location: String(job.location || source).substring(0, 100),
        type: String(job.type || "Full-time"),
        category,
        deadline: job.deadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: String(job.description || `Jobs from ${source}`).substring(0, 200),
        salary: String(job.salary || "Varies"),
      }));

    console.log(`Extracted ${mappedJobs.length} jobs from ${source}`);
    return mappedJobs;
  } catch (error) {
    console.error(`Error extracting jobs with AI from ${source}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function scrapeGovernmentJobs(): Promise<InsertJob[]> {
  const jobs: InsertJob[] = [];
  const maxJobs = 50;

  // Scrape central government sources
  for (const source of OFFICIAL_SOURCES.central.slice(0, 8)) {
    if (jobs.length >= maxJobs) break;

    try {
      console.log(`Fetching ${source.name}...`);
      const html = await fetchWithRetry(source.url);

      if (!html) {
        console.warn(`No HTML retrieved from ${source.name}`);
        continue;
      }

      const extractedJobs = await extractJobsWithAI(html, source.name);
      jobs.push(...extractedJobs);
    } catch (error) {
      console.error(`Error processing ${source.name}:`, error);
    }
  }

  // Scrape state PSC sources
  for (const source of OFFICIAL_SOURCES.states.slice(0, 6)) {
    if (jobs.length >= maxJobs) break;

    try {
      console.log(`Fetching ${source.name}...`);
      const html = await fetchWithRetry(source.url);

      if (!html) {
        console.warn(`No HTML retrieved from ${source.name}`);
        continue;
      }

      const extractedJobs = await extractJobsWithAI(html, source.name);
      jobs.push(...extractedJobs);
    } catch (error) {
      console.error(`Error processing ${source.name}:`, error);
    }
  }

  return jobs;
}

export async function updateJobsFromOfficialSources(): Promise<number> {
  try {
    if (!genAI) {
      throw new Error(
        "Gemini API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY environment variable."
      );
    }

    console.log("Starting AI-powered job scraping from official government sources...");
    const scrapedJobs = await scrapeGovernmentJobs();

    if (scrapedJobs.length === 0) {
      console.warn("No jobs were extracted by AI - this may indicate fetch or parsing issues");
      return 0;
    }

    let addedCount = 0;
    for (const job of scrapedJobs) {
      try {
        await storage.createJob(job);
        addedCount++;
        console.log(`Added job: ${job.title} from ${job.company}`);
      } catch (error) {
        console.error("Error saving job:", error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`Successfully added ${addedCount} new jobs to database`);
    return addedCount;
  } catch (error) {
    console.error("Error updating jobs:", error);
    throw error;
  }
}
