import { z } from "zod";

// Student Profile Schema
export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  education: string;
  skills: string;
  experience: string;
  photoUrl?: string;
  profileData?: string; // JSON string with detailed profile info
  createdAt: string;
  updatedAt: string;
}

export const insertStudentProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string(),
  address: z.string(),
  education: z.string(),
  skills: z.string(),
  experience: z.string(),
  photoUrl: z.string().optional(),
  profileData: z.string().optional(),
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

export const REQUIRED_DOCUMENTS = [
  "Photo (Recent Passport Size)",
  "Signature",
  "Thumb Impression (if required)",
  "10th Marksheet / Certificate",
  "12th Marksheet / Certificate",
  "Graduation Certificate / Diploma",
  "Caste / EWS / PwD certificates",
  "Experience certificate (if applicable)",
  "Identity proof scan (Aadhaar / PAN / Voter ID / Passport / DL)",
];

// Document Schema
export interface Document {
  id: string;
  studentId: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedDate: string;
}

export const insertDocumentSchema = z.object({
  studentId: z.string(),
  name: z.string().min(1, "Document name is required"),
  type: z.string(),
  size: z.string(),
  url: z.string(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Signature Schema
export interface Signature {
  id: string;
  studentId: string;
  dataUrl: string;
  createdAt: string;
}

export const insertSignatureSchema = z.object({
  studentId: z.string(),
  dataUrl: z.string().min(1, "Signature data is required"),
});

export type InsertSignature = z.infer<typeof insertSignatureSchema>;

// Job Schema
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  deadline: string;
  description: string;
  salary?: string;
  requirements?: string;
  createdAt: string;
}

export const insertJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string(),
  category: z.string().default("Central Government"),
  deadline: z.string(),
  description: z.string(),
  salary: z.string().optional(),
  requirements: z.string().optional(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;

export const JOB_CATEGORIES = [
  "Central Government",
  "State Government",
  "Public Sector Undertaking (PSU)",
  "Defence",
  "Railways",
  "Banking",
  "Police",
  "Judiciary",
  "Teaching / Education",
  "Health / Medical",
  "Engineering / Technical",
  "Administrative / Civil Services",
  "Apprenticeship",
  "Contract / Temporary",
  "Internship / Training",
] as const;

// Application Schema
export interface Application {
  id: string;
  studentId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: "pending" | "applied" | "admit_card_released" | "result_released" | "selected" | "rejected";
  deadline?: string;
  admitCardUrl?: string;
  resultUrl?: string;
  formData?: string; // JSON string of form field mappings
}

export const insertApplicationSchema = z.object({
  studentId: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  status: z.enum(["pending", "applied", "admit_card_released", "result_released", "selected", "rejected"]).default("pending"),
  deadline: z.string().optional(),
  admitCardUrl: z.string().optional(),
  resultUrl: z.string().optional(),
  formData: z.string().optional(),
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export const APPLICATION_STATUSES = [
  { value: "pending", label: "Pending", icon: "Clock" },
  { value: "applied", label: "Applied", icon: "CheckCircle2" },
  { value: "admit_card_released", label: "Admit Card Released", icon: "FileText" },
  { value: "result_released", label: "Result Released", icon: "Award" },
  { value: "selected", label: "Selected", icon: "Trophy" },
  { value: "rejected", label: "Rejected", icon: "AlertCircle" },
] as const;
