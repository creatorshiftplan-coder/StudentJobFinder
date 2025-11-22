import {
  type StudentProfile,
  type InsertStudentProfile,
  type Document,
  type InsertDocument,
  type Signature,
  type InsertSignature,
  type Job,
  type InsertJob,
  type Application,
  type InsertApplication,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Student Profile
  getProfile(id: string): Promise<StudentProfile | undefined>;
  getDefaultProfile(): Promise<StudentProfile | undefined>;
  createProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByStudent(studentId: string): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Signature
  getSignature(studentId: string): Promise<Signature | undefined>;
  saveSignature(signature: InsertSignature): Promise<Signature>;

  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  searchJobs(query: string, type?: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;

  // Applications
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByStudent(studentId: string): Promise<Application[]>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: string, app: Partial<InsertApplication>): Promise<Application>;
}

export class MemStorage implements IStorage {
  private profiles: Map<string, StudentProfile>;
  private documents: Map<string, Document>;
  private signatures: Map<string, Signature>;
  private jobs: Map<string, Job>;
  private applications: Map<string, Application>;

  constructor() {
    this.profiles = new Map();
    this.documents = new Map();
    this.signatures = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    
    // Seed a default profile for MVP
    this.seedDefaultProfile();
  }

  private seedDefaultProfile() {
    const defaultProfile: StudentProfile = {
      id: "default-student-id",
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      education: "",
      skills: "",
      experience: "",
      photoUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(defaultProfile.id, defaultProfile);
  }

  // Student Profile Methods
  async getProfile(id: string): Promise<StudentProfile | undefined> {
    return this.profiles.get(id);
  }

  async getDefaultProfile(): Promise<StudentProfile | undefined> {
    // Return the first profile (for single-user MVP)
    return Array.from(this.profiles.values())[0];
  }

  async createProfile(insertProfile: InsertStudentProfile): Promise<StudentProfile> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const profile: StudentProfile = {
      ...insertProfile,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async updateProfile(id: string, updates: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error("Profile not found");
    }
    const updated: StudentProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(id, updated);
    return updated;
  }

  // Document Methods
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByStudent(studentId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.studentId === studentId
    );
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const doc: Document = {
      ...insertDoc,
      id,
      uploadedDate: new Date().toISOString(),
    };
    this.documents.set(id, doc);
    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Signature Methods
  async getSignature(studentId: string): Promise<Signature | undefined> {
    return Array.from(this.signatures.values()).find(
      (sig) => sig.studentId === studentId
    );
  }

  async saveSignature(insertSig: InsertSignature): Promise<Signature> {
    // Delete existing signature for this student
    const existing = await this.getSignature(insertSig.studentId);
    if (existing) {
      this.signatures.delete(existing.id);
    }

    const id = randomUUID();
    const signature: Signature = {
      ...insertSig,
      id,
      createdAt: new Date().toISOString(),
    };
    this.signatures.set(id, signature);
    return signature;
  }

  // Job Methods
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async searchJobs(query: string, type?: string, category?: string): Promise<Job[]> {
    const allJobs = Array.from(this.jobs.values());
    return allJobs.filter((job) => {
      const matchesQuery = query
        ? job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.company.toLowerCase().includes(query.toLowerCase()) ||
          job.description.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesType = type && type !== "all" ? job.type === type : true;
      const matchesCategory = category && category !== "all" ? job.category === category : true;
      return matchesQuery && matchesType && matchesCategory;
    });
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    return job;
  }

  // Application Methods
  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.studentId === studentId
    );
  }

  async createApplication(insertApp: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const app: Application = {
      ...insertApp,
      id,
      appliedDate: new Date().toISOString(),
    };
    this.applications.set(id, app);
    return app;
  }

  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application> {
    const existing = this.applications.get(id);
    if (!existing) {
      throw new Error("Application not found");
    }
    const updated: Application = {
      ...existing,
      ...updates,
    };
    this.applications.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
