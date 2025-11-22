import type { InsertJob } from "@shared/schema";

interface CacheEntry {
  jobs: InsertJob[];
  timestamp: number;
  source: string;
}

interface ScrapingLog {
  timestamp: string;
  sources: string[];
  jobsAdded: number;
  status: "success" | "failed";
  error?: string;
}

class JobCache {
  private cache: Map<string, CacheEntry> = new Map();
  private logs: ScrapingLog[] = [];

  addJobs(source: string, jobs: InsertJob[]): void {
    this.cache.set(source, {
      jobs,
      timestamp: Date.now(),
      source,
    });
  }

  getJobs(source?: string): InsertJob[] {
    if (!source) {
      const allJobs: InsertJob[] = [];
      this.cache.forEach((entry) => allJobs.push(...entry.jobs));
      return allJobs;
    }
    return this.cache.get(source)?.jobs || [];
  }

  getAllCached(): Map<string, CacheEntry> {
    return this.cache;
  }

  getCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.cache.forEach((entry, source) => {
      stats[source] = {
        jobCount: entry.jobs.length,
        lastUpdated: new Date(entry.timestamp).toISOString(),
      };
    });
    return stats;
  }

  addLog(sources: string[], jobsAdded: number, status: "success" | "failed", error?: string): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      sources,
      jobsAdded,
      status,
      error,
    });

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  getLogs(): ScrapingLog[] {
    return this.logs;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const jobCache = new JobCache();
