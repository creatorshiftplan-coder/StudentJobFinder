import { getSupabase, isSupabaseEnabled } from "./supabase";

interface TestResult {
  function: string;
  status: "✅ WORKING" | "❌ ERROR";
  message: string;
  timestamp: string;
}

export async function testAllEdgeFunctions(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  if (!isSupabaseEnabled()) {
    results.push({
      function: "All",
      status: "❌ ERROR",
      message: "Supabase not configured",
      timestamp: new Date().toISOString(),
    });
    return results;
  }

  const supabase = getSupabase();
  if (!supabase) {
    results.push({
      function: "All",
      status: "❌ ERROR",
      message: "Supabase client not initialized",
      timestamp: new Date().toISOString(),
    });
    return results;
  }

  const supabaseUrl = process.env.SUPABASE_URL;

  // Test 1: Job Scraper
  try {
    console.log("[TEST] Testing job-scraper edge function...");
    const jobScraperUrl = `${supabaseUrl}/functions/v1/job-scraper`;
    const response = await fetch(jobScraperUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        function: "job-scraper",
        status: "✅ WORKING",
        message: `Successfully scraped jobs. Total added: ${data.jobsAdded || 0}`,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ job-scraper: WORKING");
    } else {
      results.push({
        function: "job-scraper",
        status: "❌ ERROR",
        message: `HTTP ${response.status}: ${data.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
      console.log("❌ job-scraper: ERROR");
    }
  } catch (error: any) {
    results.push({
      function: "job-scraper",
      status: "❌ ERROR",
      message: error.message || "Network error",
      timestamp: new Date().toISOString(),
    });
    console.log("❌ job-scraper: ERROR -", error.message);
  }

  // Test 2: OCR Extract (with test image)
  try {
    console.log("[TEST] Testing ocr-extract edge function...");
    const ocrUrl = `${supabaseUrl}/functions/v1/ocr-extract`;
    
    // Simple test image (1x1 white pixel)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const testImageUrl = `data:image/png;base64,${testImageBase64}`;
    
    const response = await fetch(ocrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        userId: "test-user-id",
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      results.push({
        function: "ocr-extract",
        status: "✅ WORKING",
        message: `Successfully processed image. Extracted data: ${JSON.stringify(data.data).substring(0, 100)}...`,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ ocr-extract: WORKING");
    } else {
      results.push({
        function: "ocr-extract",
        status: "❌ ERROR",
        message: `HTTP ${response.status}: ${data.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
      console.log("❌ ocr-extract: ERROR");
    }
  } catch (error: any) {
    results.push({
      function: "ocr-extract",
      status: "❌ ERROR",
      message: error.message || "Network error",
      timestamp: new Date().toISOString(),
    });
    console.log("❌ ocr-extract: ERROR -", error.message);
  }

  // Test 3: Job Tracker
  try {
    console.log("[TEST] Testing job-tracker edge function...");
    const trackerUrl = `${supabaseUrl}/functions/v1/job-tracker`;
    
    const response = await fetch(trackerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: "getAll",
        userId: "test-user-id",
      }),
    });

    const data = await response.json();

    if (response.ok && data.success !== false) {
      const appCount = data.applications?.length || 0;
      results.push({
        function: "job-tracker",
        status: "✅ WORKING",
        message: `Successfully retrieved applications. Count: ${appCount}`,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ job-tracker: WORKING");
    } else {
      results.push({
        function: "job-tracker",
        status: "❌ ERROR",
        message: `HTTP ${response.status}: ${data.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
      console.log("❌ job-tracker: ERROR");
    }
  } catch (error: any) {
    results.push({
      function: "job-tracker",
      status: "❌ ERROR",
      message: error.message || "Network error",
      timestamp: new Date().toISOString(),
    });
    console.log("❌ job-tracker: ERROR -", error.message);
  }

  return results;
}
