import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type {
  StudentProfile,
  InsertStudentProfile,
  Document,
  InsertDocument,
  Signature,
  InsertSignature,
  Job,
  InsertJob,
  Application,
  InsertApplication,
} from "@shared/schema";
import { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  constructor(private supabase: SupabaseClient, private userId: string) {}

  // Student Profile Methods
  async getProfile(id: string): Promise<StudentProfile | undefined> {
    const { data, error } = await this.supabase
      .from("student_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) return undefined;
    return this.mapProfile(data);
  }

  async getDefaultProfile(): Promise<StudentProfile | undefined> {
    const { data, error } = await this.supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // Create default profile if none exists
      return this.createProfile({
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        education: "",
        skills: "",
        experience: "",
      });
    }

    return this.mapProfile(data);
  }

  async createProfile(insertProfile: InsertStudentProfile): Promise<StudentProfile> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("student_profiles")
      .insert({
        user_id: this.userId,
        full_name: insertProfile.fullName,
        email: insertProfile.email,
        phone: insertProfile.phone,
        date_of_birth: insertProfile.dateOfBirth,
        address: insertProfile.address,
        education: insertProfile.education,
        skills: insertProfile.skills,
        experience: insertProfile.experience,
        photo_url: insertProfile.photoUrl,
        profile_data: insertProfile.profileData,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapProfile(data);
  }

  async updateProfile(id: string, updates: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const { data, error } = await this.supabase
      .from("student_profiles")
      .update({
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        date_of_birth: updates.dateOfBirth,
        address: updates.address,
        education: updates.education,
        skills: updates.skills,
        experience: updates.experience,
        photo_url: updates.photoUrl,
        profile_data: updates.profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapProfile(data);
  }

  // Document Methods
  async getDocument(id: string): Promise<Document | undefined> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) return undefined;
    return this.mapDocument(data);
  }

  async getDocumentsByStudent(studentId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("user_id", this.userId);

    if (error) return [];
    return data.map(d => this.mapDocument(d));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const { data, error } = await this.supabase
      .from("documents")
      .insert({
        user_id: this.userId,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: doc.url,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDocument(data);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    return !error;
  }

  // Signature Methods
  async getSignature(studentId: string): Promise<Signature | undefined> {
    // Store as special document
    const sig = await this.supabase
      .from("documents")
      .select("*")
      .eq("user_id", this.userId)
      .eq("type", "SIGNATURE")
      .single();

    if (sig.error) return undefined;
    return {
      id: sig.data.id,
      studentId: this.userId,
      dataUrl: sig.data.url,
      createdAt: sig.data.uploaded_date,
    };
  }

  async saveSignature(signature: InsertSignature): Promise<Signature> {
    const { data } = await this.supabase
      .from("documents")
      .insert({
        user_id: this.userId,
        name: "signature",
        type: "SIGNATURE",
        url: signature.dataUrl,
      })
      .select()
      .single();

    return {
      id: data.id,
      studentId: this.userId,
      dataUrl: data.url,
      createdAt: data.uploaded_date,
    };
  }

  // Job Methods
  async getJob(id: string): Promise<Job | undefined> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return this.mapJob(data);
  }

  async getAllJobs(): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select("*");

    if (error) return [];
    return data.map(j => this.mapJob(j));
  }

  async searchJobs(query: string, type?: string, category?: string): Promise<Job[]> {
    let q = this.supabase.from("jobs").select("*");

    if (query) {
      q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (type) {
      q = q.eq("type", type);
    }
    if (category) {
      q = q.eq("category", category);
    }

    const { data, error } = await q;
    if (error) return [];
    return data.map(j => this.mapJob(j));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const { data, error } = await this.supabase
      .from("jobs")
      .insert({
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        category: job.category,
        deadline: job.deadline,
        description: job.description,
        salary: job.salary,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapJob(data);
  }

  // Application Methods
  async getApplication(id: string): Promise<Application | undefined> {
    const { data, error } = await this.supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) return undefined;
    return this.mapApplication(data);
  }

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    const { data, error } = await this.supabase
      .from("applications")
      .select("*")
      .eq("user_id", this.userId);

    if (error) return [];
    return data.map(a => this.mapApplication(a));
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const { data, error } = await this.supabase
      .from("applications")
      .insert({
        user_id: this.userId,
        job_id: app.jobId,
        status: app.status || "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapApplication(data);
  }

  async updateApplication(id: string, app: Partial<InsertApplication>): Promise<Application> {
    const { data, error } = await this.supabase
      .from("applications")
      .update({
        status: app.status,
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapApplication(data);
  }

  // Helper mappers
  private mapProfile(data: any): StudentProfile {
    return {
      id: data.id,
      fullName: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      dateOfBirth: data.date_of_birth || "",
      address: data.address || "",
      education: data.education || "",
      skills: data.skills || "",
      experience: data.experience || "",
      photoUrl: data.photo_url,
      profileData: data.profile_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapDocument(data: any): Document {
    return {
      id: data.id,
      studentId: data.user_id,
      name: data.name,
      type: data.type,
      size: data.size,
      url: data.url,
      uploadedDate: data.uploaded_date,
    };
  }

  private mapJob(data: any): Job {
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type,
      category: data.category,
      deadline: data.deadline,
      description: data.description,
      salary: data.salary,
      createdAt: data.created_at,
    };
  }

  private mapApplication(data: any): Application {
    return {
      id: data.id,
      studentId: data.user_id,
      jobId: data.job_id,
      status: data.status,
      appliedDate: data.applied_date,
    };
  }
}
