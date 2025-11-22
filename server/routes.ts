import type { Express } from "express";
import { createServer, type Server } from "http";
import { jobCache } from "./cache";
import { startJobScheduler } from "./job-scheduler";
import { getSupabase, isSupabaseEnabled } from "./supabase";
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from "./auth-middleware";
import { SupabaseStorage } from "./supabase-storage";
import { testAllEdgeFunctions } from "./test-edge-functions";
import multer from "multer";
import sharp from "sharp";
import { OpenAI } from "openai";
import { updateJobsFromOfficialSources } from "./scrapers";
import { extractDataFromDocument } from "./ocr";
import {
  insertStudentProfileSchema,
  insertDocumentSchema,
  insertSignatureSchema,
  insertJobSchema,
  insertApplicationSchema,
  insertExamSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert uploaded files to base64 data URLs
function fileToDataUrl(file: Express.Multer.File): string {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Local job scheduler disabled - using Supabase Edge Functions instead
  // Uncomment line below to use local scheduler
  // startJobScheduler();

  // Get storage instance - ALWAYS use Supabase (no local fallback)
  function getStorage(req: AuthRequest) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Supabase not configured - cannot access storage");
    }
    if (!req.userId) {
      throw new Error("User ID not found - authentication required");
    }
    return new SupabaseStorage(supabase, req.userId);
  }

  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(400).json({ error: "Authentication not configured" });
    }

    try {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signUpWithPassword({
        email,
        password,
      });

      if (error) throw error;
      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(400).json({ error: "Authentication not configured" });
    }

    try {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ message: "Logged out" });
  });

  // Apply optional auth to all API endpoints
  app.use("/api", optionalAuthMiddleware);

  // Test Edge Functions Route
  app.get("/api/test/edge-functions", async (req, res) => {
    try {
      console.log("[API] Testing all edge functions...");
      const results = await testAllEdgeFunctions();
      res.json({
        timestamp: new Date().toISOString(),
        supabaseEnabled: isSupabaseEnabled(),
        results,
        summary: {
          total: results.length,
          working: results.filter(r => r.status === "✅ WORKING").length,
          errors: results.filter(r => r.status === "❌ ERROR").length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Test failed" });
    }
  });

  // Cache Routes
  app.get("/api/cache/jobs", async (req, res) => {
    try {
      const allJobs = jobCache.getJobs();
      res.json(allJobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cached jobs" });
    }
  });

  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = jobCache.getCacheStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cache stats" });
    }
  });

  app.get("/api/cache/logs", async (req, res) => {
    try {
      const logs = jobCache.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Student Profile Routes
  app.get("/api/profile", async (req: AuthRequest, res) => {
    try {
      const currentStorage = getStorage(req);
      let profile = await currentStorage.getDefaultProfile();
      
      // Always ensure a profile exists
      if (!profile) {
        const currentStorage = getStorage(req);
        profile = await currentStorage.createProfile({
          fullName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          address: "",
          education: "",
          skills: "",
          experience: "",
          photoUrl: "",
        });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req: AuthRequest, res) => {
    try {
      const data = insertStudentProfileSchema.parse(req.body);
      const currentStorage = getStorage(req);
      const profile = await currentStorage.createProfile(data);
      res.status(201).json(profile);
    } catch (error: any) {
      const message = error?.message || "Invalid profile data";
      res.status(400).json({ error: message });
    }
  });

  app.patch("/api/profile/:id", async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      // Partial validation - allow any subset of profile fields
      const updates = req.body;
      const currentStorage = getStorage(req);
      const profile = await currentStorage.updateProfile(id, updates);
      res.json(profile);
    } catch (error: any) {
      if (error.message === "Profile not found") {
        return res.status(404).json({ error: "Profile not found" });
      }
      const message = error?.message || "Failed to update profile";
      res.status(400).json({ error: message });
    }
  });

  // Document Routes
  app.get("/api/documents/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const documents = await getStorage(req).getDocumentsByStudent(studentId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "Student ID is required" });
      }

      const dataUrl = fileToDataUrl(req.file);
      const sizeInKB = (req.file.size / 1024).toFixed(2);

      const docData = insertDocumentSchema.parse({
        studentId,
        name: req.file.originalname,
        type: req.file.mimetype.split("/")[1].toUpperCase(),
        size: `${sizeInKB} KB`,
        url: dataUrl,
      });

      const document = await getStorage(req).createDocument(docData);
      res.status(201).json(document);
    } catch (error: any) {
      const message = error?.message || "Failed to upload document";
      console.error("Document upload error:", error);
      res.status(400).json({ error: message });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await getStorage(req).deleteDocument(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Document not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // OCR Extraction Route
  app.post("/api/documents/extract-ocr", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      console.log("Starting OCR extraction...");
      const extractedData = await extractDataFromDocument(imageUrl);
      console.log("OCR extraction completed:", extractedData);
      
      res.json({ success: true, data: extractedData });
    } catch (error: any) {
      console.error("OCR extraction error:", error);
      res.status(500).json({ 
        error: "Failed to extract data from document",
        details: error?.message 
      });
    }
  });

  // Signature Routes
  app.get("/api/signature/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const signature = await getStorage(req).getSignature(studentId);
      if (!signature) {
        return res.status(404).json({ error: "Signature not found" });
      }
      res.json(signature);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signature" });
    }
  });

  app.post("/api/signature", async (req, res) => {
    try {
      const data = insertSignatureSchema.parse(req.body);
      const signature = await getStorage(req).saveSignature(data);
      res.status(201).json(signature);
    } catch (error) {
      res.status(400).json({ error: "Failed to save signature" });
    }
  });

  // Photo Upload and Resize Routes
  app.post("/api/photo/upload", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      const dataUrl = fileToDataUrl(req.file);
      res.status(201).json({ url: dataUrl });
    } catch (error) {
      res.status(400).json({ error: "Failed to upload photo" });
    }
  });

  app.post("/api/photo/resize", async (req, res) => {
    try {
      const { imageData, dimension } = req.body;
      
      // Define dimension presets
      const dimensions: Record<string, { width: number; height: number }> = {
        passport: { width: 140, height: 180 }, // 35mm x 45mm at 100 DPI
        "id-card": { width: 100, height: 120 }, // 25mm x 30mm at 100 DPI
        resume: { width: 200, height: 200 },
      };

      const targetDim = dimensions[dimension] || { width: 200, height: 200 };

      // Remove data URL prefix
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Resize image
      const resizedBuffer = await sharp(buffer)
        .resize(targetDim.width, targetDim.height, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();

      const resizedDataUrl = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;
      res.json({ url: resizedDataUrl });
    } catch (error) {
      res.status(400).json({ error: "Failed to resize photo" });
    }
  });

  // Job Routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { query = "", type, category } = req.query;
      const jobs = await getStorage(req).searchJobs(
        query as string,
        type as string | undefined,
        category as string | undefined
      );
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Scrape and update jobs from official government sources
  app.post("/api/jobs/scrape-official", async (req, res) => {
    try {
      const count = await updateJobsFromOfficialSources();
      res.json({ 
        message: `Successfully scraped and added ${count} jobs from official government sources`,
        count,
      });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Failed to scrape official job sources" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await getStorage(req).getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const data = insertJobSchema.parse(req.body);
      const job = await getStorage(req).createJob(data);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  // Application Routes
  app.get("/api/applications/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const applications = await getStorage(req).getApplicationsByStudent(studentId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      const application = await getStorage(req).createApplication(data);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ error: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const application = await getStorage(req).updateApplication(id, updates);
      res.json(application);
    } catch (error: any) {
      if (error.message === "Application not found") {
        return res.status(404).json({ error: "Application not found" });
      }
      res.status(400).json({ error: "Failed to update application" });
    }
  });

  // Exam Routes
  app.get("/api/exams/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const exams = await getStorage(req).getExamsByStudent(studentId);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  app.post("/api/exams", async (req, res) => {
    try {
      const profile = await getStorage(req).getDefaultProfile();
      if (!profile) {
        return res.status(400).json({ error: "Student profile not found" });
      }
      
      try {
        const data = insertExamSchema.parse({
          ...req.body,
          studentId: profile.id,
        });
        const exam = await getStorage(req).createExam(data);
        res.status(201).json(exam);
      } catch (validationError: any) {
        console.error("[Exam Validation Error]", validationError.errors);
        res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.errors 
        });
      }
    } catch (error: any) {
      console.error("[Exam Creation Error]", error);
      res.status(500).json({ error: error.message || "Failed to create exam" });
    }
  });

  // AI-Powered Form Auto-Fill Suggestions
  app.post("/api/ai/form-suggestions", async (req, res) => {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          error: "AI service is not configured. Please add OPENAI_API_KEY to environment variables.",
        });
      }

      const { profileData, formFields } = req.body;

      if (!profileData || !formFields) {
        return res.status(400).json({ error: "Profile data and form fields are required" });
      }

      const prompt = `You are an AI assistant helping students fill job application forms automatically.

Given the student's profile:
${JSON.stringify(profileData, null, 2)}

And the following form fields that need to be filled:
${JSON.stringify(formFields, null, 2)}

Please provide intelligent suggestions for how to fill each form field based on the student's profile data. Return a JSON object mapping form field names to suggested values. Extract and format data appropriately.

Example response format:
{
  "full_name": "Rajesh Kumar",
  "email": "rajesh.kumar@email.com",
  "phone": "9876543210",
  "address": "123 Main Street, Mumbai, Maharashtra",
  "qualification": "B.Tech Computer Science",
  "skills": "JavaScript, React, Node.js, Python"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that maps student profile data to job application form fields. Always respond with valid JSON only, no explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const suggestions = JSON.parse(completion.choices[0].message.content || "{}");
      res.json({ suggestions });
    } catch (error: any) {
      console.error("AI form suggestions error:", error);
      const message = error?.message || "Failed to generate form suggestions";
      res.status(500).json({ error: message });
    }
  });

  // Seed some initial job data for testing
  const seedJobs = async () => {
    try {
      const existingJobs = await getStorage(req).getAllJobs();
      if (existingJobs.length === 0) {
        await getStorage(req).createJob({
          title: "Software Engineer",
          company: "Tech Solutions Ltd",
          location: "Bangalore, India",
          type: "Full-time",
          category: "Engineering / Technical",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: "We are seeking a talented Software Engineer to join our team.",
          salary: "₹8-12 LPA",
        });

        await getStorage(req).createJob({
          title: "Data Analyst",
          company: "Analytics Corp",
          location: "Hyderabad, India",
          type: "Full-time",
          category: "Central Government",
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: "Looking for a skilled Data Analyst to help us make data-driven decisions.",
          salary: "₹6-9 LPA",
        });

        await getStorage(req).createJob({
          title: "Frontend Developer",
          company: "WebDev Studios",
          location: "Mumbai, India",
          type: "Contract",
          category: "Engineering / Technical",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: "Join our creative team to build beautiful web applications.",
          salary: "₹7-10 LPA",
        });
      }
    } catch (error) {
      console.error("Error seeding jobs:", error);
    }
  };

  seedJobs();

  const httpServer = createServer(app);
  return httpServer;
}
