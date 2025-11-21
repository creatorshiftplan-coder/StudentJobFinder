import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import sharp from "sharp";
import { OpenAI } from "openai";
import {
  insertStudentProfileSchema,
  insertDocumentSchema,
  insertSignatureSchema,
  insertJobSchema,
  insertApplicationSchema,
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
  // Student Profile Routes
  app.get("/api/profile", async (req, res) => {
    try {
      let profile = await storage.getDefaultProfile();
      
      // Always ensure a profile exists
      if (!profile) {
        profile = await storage.createProfile({
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

  app.post("/api/profile", async (req, res) => {
    try {
      const data = insertStudentProfileSchema.parse(req.body);
      const profile = await storage.createProfile(data);
      res.status(201).json(profile);
    } catch (error: any) {
      const message = error?.message || "Invalid profile data";
      res.status(400).json({ error: message });
    }
  });

  app.patch("/api/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Partial validation - allow any subset of profile fields
      const updates = req.body;
      const profile = await storage.updateProfile(id, updates);
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
      const documents = await storage.getDocumentsByStudent(studentId);
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

      const document = await storage.createDocument(docData);
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
      const deleted = await storage.deleteDocument(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Document not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Signature Routes
  app.get("/api/signature/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const signature = await storage.getSignature(studentId);
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
      const signature = await storage.saveSignature(data);
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
      const { query = "", type } = req.query;
      const jobs = await storage.searchJobs(
        query as string,
        type as string | undefined
      );
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);
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
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  // Application Routes
  app.get("/api/applications/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const applications = await storage.getApplicationsByStudent(studentId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(data);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ error: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const application = await storage.updateApplication(id, updates);
      res.json(application);
    } catch (error: any) {
      if (error.message === "Application not found") {
        return res.status(404).json({ error: "Application not found" });
      }
      res.status(400).json({ error: "Failed to update application" });
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
    const existingJobs = await storage.getAllJobs();
    if (existingJobs.length === 0) {
      await storage.createJob({
        title: "Software Engineer",
        company: "Tech Solutions Ltd",
        location: "Bangalore, India",
        type: "Full-time",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "We are seeking a talented Software Engineer to join our team.",
        salary: "₹8-12 LPA",
      });

      await storage.createJob({
        title: "Data Analyst",
        company: "Analytics Corp",
        location: "Hyderabad, India",
        type: "Full-time",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "Looking for a skilled Data Analyst to help us make data-driven decisions.",
        salary: "₹6-9 LPA",
      });

      await storage.createJob({
        title: "Frontend Developer",
        company: "WebDev Studios",
        location: "Mumbai, India",
        type: "Contract",
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: "Join our creative team to build beautiful web applications.",
        salary: "₹7-10 LPA",
      });
    }
  };

  seedJobs();

  const httpServer = createServer(app);
  return httpServer;
}
