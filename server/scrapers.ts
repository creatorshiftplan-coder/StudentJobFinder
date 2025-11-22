import * as cheerio from 'cheerio';
import { storage } from './storage';
import type { InsertJob } from '@shared/schema';

// Blacklisted job scraping sites to avoid
const BLACKLISTED_DOMAINS = [
  'sarkariresult.com',
  'freejobalert.com',
  'mysarkarinaukri.com',
  'sarkarinaukri.com',
  'govtjobs.co.in',
  'jagranjosh.com',
];

// Official government recruitment sources
const OFFICIAL_SOURCES = {
  central: [
    { name: 'UPSC', url: 'https://www.upsc.gov.in', type: 'UPSC Exams' },
    { name: 'SSC', url: 'https://www.ssc.nic.in', type: 'SSC Exams' },
    { name: 'RRB', url: 'https://www.rrbcdg.gov.in', type: 'Railway Jobs' },
    { name: 'IBPS', url: 'https://www.ibps.in', type: 'Banking Jobs' },
    { name: 'RBI', url: 'https://opportunities.rbi.org.in', type: 'RBI Jobs' },
    { name: 'SBI', url: 'https://sbi.co.in/careers', type: 'Banking Jobs' },
    { name: 'India Post', url: 'https://indiapostgdsonline.gov.in', type: 'Postal Jobs' },
    { name: 'DRDO', url: 'https://www.drdo.gov.in', type: 'Defence Jobs' },
    { name: 'ISRO', url: 'https://www.isro.gov.in/Careers.html', type: 'Space Jobs' },
    { name: 'BARC', url: 'https://recruit.barc.gov.in', type: 'Atomic Jobs' },
    { name: 'AIIMS', url: 'https://www.aiimsexams.ac.in', type: 'Medical Jobs' },
    { name: 'ESIC', url: 'https://www.esic.nic.in', type: 'Labour Jobs' },
    { name: 'FCI', url: 'https://coalindia.in/en-us/careers', type: 'Food Jobs' },
    { name: 'Coal India', url: 'https://coalindia.in/en-us/careers', type: 'Coal Jobs' },
    { name: 'BSNL', url: 'https://www.bsnl.co.in/opportunities', type: 'Telecom Jobs' },
    { name: 'LIC', url: 'https://www.licindia.in/careers', type: 'Insurance Jobs' },
    { name: 'UCIL', url: 'https://ucil.gov.in/job.html', type: 'Uranium Jobs' },
    { name: 'AAI', url: 'https://www.aai.aero/en/careers', type: 'Aviation Jobs' },
    { name: 'NTPC', url: 'https://www.ntpc.co.in/en/careers', type: 'Power Jobs' },
    { name: 'BHEL', url: 'https://www.bhel.com/careers/current-openings', type: 'Power Jobs' },
    { name: 'HPCL', url: 'https://www.hpclcareers.com', type: 'Oil Jobs' },
    { name: 'Indian Oil', url: 'https://www.indianoil.co.in/careers', type: 'Oil Jobs' },
    { name: 'ITB Police', url: 'https://recruitment.itbpolice.nic.in', type: 'Police Jobs' },
    { name: 'BSF', url: 'https://rectt.bsf.gov.in', type: 'Defence Jobs' },
    { name: 'CISF', url: 'https://cisfrectt.cisf.gov.in', type: 'Defence Jobs' },
    { name: 'Assam Rifles', url: 'https://assamrifles.gov.in', type: 'Military Jobs' },
    { name: 'MHA CAPF', url: 'https://www.mha.gov.in', type: 'Police Jobs' },
  ],
  states: [
    { name: 'West Bengal PSC', url: 'https://wbpsc.gov.in', state: 'West Bengal' },
    { name: 'Uttar Pradesh PSC', url: 'https://uppsc.up.nic.in', state: 'Uttar Pradesh' },
    { name: 'Bihar PSC', url: 'https://bpsc.bih.nic.in', state: 'Bihar' },
    { name: 'Rajasthan PSC', url: 'https://rpsc.rajasthan.gov.in', state: 'Rajasthan' },
    { name: 'Maharashtra PSC', url: 'https://mpsc.gov.in', state: 'Maharashtra' },
    { name: 'Gujarat PSC', url: 'https://gpsc.gujarat.gov.in', state: 'Gujarat' },
    { name: 'Tamil Nadu PSC', url: 'https://www.tnpsc.gov.in', state: 'Tamil Nadu' },
    { name: 'Karnataka PSC', url: 'https://www.kpsc.kar.nic.in', state: 'Karnataka' },
    { name: 'Telangana PSC', url: 'https://www.tspsc.gov.in', state: 'Telangana' },
    { name: 'Andhra Pradesh PSC', url: 'https://psc.ap.gov.in', state: 'Andhra Pradesh' },
    { name: 'Odisha PSC', url: 'https://www.opsc.gov.in', state: 'Odisha' },
    { name: 'Kerala PSC', url: 'https://www.keralapsc.gov.in', state: 'Kerala' },
    { name: 'Haryana PSC', url: 'https://hpsc.gov.in', state: 'Haryana' },
    { name: 'Himachal Pradesh PSC', url: 'https://hppsc.hp.gov.in', state: 'Himachal Pradesh' },
    { name: 'Uttarakhand PSC', url: 'https://ukpsc.net.in', state: 'Uttarakhand' },
    { name: 'Jammu & Kashmir PSC', url: 'https://jkpsc.nic.in', state: 'Jammu & Kashmir' },
    { name: 'Madhya Pradesh PSC', url: 'https://mppsc.mp.gov.in', state: 'Madhya Pradesh' },
    { name: 'Jharkhand', url: 'https://jharkhand.gov.in/recruitment', state: 'Jharkhand' },
    { name: 'Tripura PSC', url: 'https://www.tpsc.tripura.gov.in', state: 'Tripura' },
    { name: 'Assam PSC', url: 'https://www.apsc.nic.in', state: 'Assam' },
    { name: 'Punjab PSC', url: 'https://ppsc.gov.in', state: 'Punjab' },
    { name: 'Goa PSC', url: 'https://gpsc.goa.gov.in', state: 'Goa' },
    { name: 'Sikkim PSC', url: 'https://www.spscskm.gov.in', state: 'Sikkim' },
    { name: 'Manipur PSC', url: 'https://www.mpscmanipur.gov.in', state: 'Manipur' },
    { name: 'Mizoram PSC', url: 'http://mpsc.mizoram.gov.in', state: 'Mizoram' },
    { name: 'Nagaland PSC', url: 'https://nlpsc.nic.in', state: 'Nagaland' },
    { name: 'Arunachal Pradesh', url: 'https://www.arunachalpradesh.gov.in', state: 'Arunachal Pradesh' },
    { name: 'Chhattisgarh PSC', url: 'https://cgpsc.gov.in', state: 'Chhattisgarh' },
    { name: 'TN Police', url: 'https://www.tnusrb.tn.gov.in', state: 'Tamil Nadu' },
    { name: 'TN Teaching', url: 'https://trb.tn.gov.in', state: 'Tamil Nadu' },
    { name: 'Haryana SSC', url: 'https://www.hssc.gov.in', state: 'Haryana' },
    { name: 'Delhi Subordinate', url: 'https://dsssb.delhi.gov.in', state: 'Delhi' },
  ],
};

interface ScrapedJob extends Omit<InsertJob, 'type'> {
  source: string;
  sourceUrl: string;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

export async function scrapeGovernmentJobs(): Promise<InsertJob[]> {
  const jobs: InsertJob[] = [];
  const maxJobs = 50; // Limit to avoid overwhelming the system

  try {
    // Scrape Central Government jobs
    for (const source of OFFICIAL_SOURCES.central.slice(0, 10)) {
      try {
        const html = await fetchWithTimeout(source.url);
        if (!html) continue;

        const $ = cheerio.load(html);
        
        // Generic selectors for common government job portals
        const jobElements = $(
          'div[class*="job"], div[class*="notification"], div[class*="vacancy"], ' +
          'div[class*="recruitment"], tr[class*="job"], li[class*="job"]'
        ).slice(0, 5);

        jobElements.each((_, element) => {
          const $elem = $(element);
          const title = $elem.find('a, h2, h3, h4').first().text().trim();
          const description = $elem.find('p, span, div').text().trim().substring(0, 200);

          if (title && jobs.length < maxJobs) {
            jobs.push({
              title: title.substring(0, 100),
              company: source.name,
              location: 'India',
              type: 'Full-time',
              deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              description: description || `${(source as any).type} - Apply on ${source.name} official portal`,
              salary: 'Varies',
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    // Scrape State PSC jobs
    for (const source of OFFICIAL_SOURCES.states.slice(0, 10)) {
      if (jobs.length >= maxJobs) break;

      try {
        const html = await fetchWithTimeout(source.url);
        if (!html) continue;

        const $ = cheerio.load(html);
        const jobElements = $(
          'div[class*="notification"], div[class*="vacancy"], ' +
          'tr[class*="notice"], li[class*="job"]'
        ).slice(0, 3);

        jobElements.each((_, element) => {
          const $elem = $(element);
          const title = $elem.find('a, h3, h4').first().text().trim();
          const description = $elem.text().trim().substring(0, 200);

          if (title && jobs.length < maxJobs) {
            jobs.push({
              title: title.substring(0, 100),
              company: source.name,
              location: (source as any).state,
              type: 'Full-time',
              deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              description: description || `State PSC Recruitment - Apply on ${source.name} official portal`,
              salary: 'Varies',
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in scrapeGovernmentJobs:', error);
  }

  return jobs;
}

export async function updateJobsFromOfficialSources(): Promise<number> {
  try {
    // Clear old jobs and add new ones from official sources
    const scrapedJobs = await scrapeGovernmentJobs();
    
    let addedCount = 0;
    for (const job of scrapedJobs) {
      try {
        await storage.createJob(job);
        addedCount++;
      } catch (error) {
        console.error('Error saving job:', error);
      }
    }

    return addedCount;
  } catch (error) {
    console.error('Error updating jobs:', error);
    return 0;
  }
}

export function isBlacklistedSource(url: string): boolean {
  return BLACKLISTED_DOMAINS.some(domain => url.includes(domain));
}
