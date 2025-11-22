import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save, Loader2, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile, InsertStudentProfile } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSection, setExpandedSection] = useState<string>("personal");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    education: "",
    skills: "",
    experience: "",
    photoUrl: "",
    // Personal Details
    fathersName: "",
    mothersName: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    category: "",
    disabilityStatus: "",
    disabilityType: "",
    minorityStatus: "",
    identificationIssueType: "",
    identificationNumber: "",
    // Contact Information
    mobileNumber: "",
    correspondenceAddress: "",
    state: "",
    district: "",
    pinCode: "",
    // Educational Qualification
    highestQualification: "",
    courseName: "",
    boardUniversity: "",
    dateOfPassing: "",
    rollNumber: "",
    percentageCGPA: "",
    stream: "",
    additionalQualifications: "",
    // Employment Experience
    workExperience: "",
    organizationName: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    totalExperience: "",
    salary: "",
    // Reservation & Certificates
    casteCertificateNumber: "",
    casteCertificateIssueDate: "",
    casteCertificateAuthority: "",
    ewsCertificateNumber: "",
    pwdMedicalCertificate: "",
    nccCertificate: "",
    exServicemanDetails: "",
    domicileCertificate: "",
    // Exam Specific
    examCenterPreference: "",
    postPreference: "",
    languagePreference: "",
    shiftPreference: "",
    // Declarations
    selfDeclaration: "",
  });

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    if (profile) {
      const profileData = profile.profileData ? JSON.parse(profile.profileData) : {};
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        address: profile.address || "",
        education: profile.education || "",
        skills: profile.skills || "",
        experience: profile.experience || "",
        photoUrl: profile.photoUrl || "",
        ...profileData,
      });
    }
  }, [profile]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: InsertStudentProfile) => {
      return await apiRequest("/api/profile", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<InsertStudentProfile>) => {
      return await apiRequest(`/api/profile/${profile!.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return await apiRequest("/api/photo/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data: { url: string }) => {
      setFormData((prev) => ({ ...prev, photoUrl: data.url }));
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const calculateProfileCompletion = () => {
    const allFields = Object.values(formData);
    const filledFields = allFields.filter(field => field && field !== "");
    return Math.round((filledFields.length / allFields.length) * 100);
  };

  const handleSave = () => {
    const { fullName, email, phone, dateOfBirth, address, education, skills, experience, photoUrl, ...profileDataFields } = formData;
    const data: InsertStudentProfile = {
      fullName,
      email,
      phone,
      dateOfBirth,
      address,
      education,
      skills,
      experience,
      photoUrl,
      profileData: JSON.stringify(profileDataFields),
    };

    if (profile) {
      updateProfileMutation.mutate(data);
    } else {
      createProfileMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and credentials</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.photoUrl || undefined} alt="Profile" />
              <AvatarFallback>{formData.fullName.slice(0, 2).toUpperCase() || "ST"}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 rounded-full"
              data-testid="button-upload-photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
            >
              {uploadPhotoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{formData.fullName || "Your Name"}</h3>
            <p className="text-sm text-muted-foreground">{formData.email || "your.email@example.com"}</p>
            <p className="text-sm font-semibold text-primary mt-2">{calculateProfileCompletion()}% Profile Completed</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Personal Details Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "personal" ? "" : "personal")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Personal</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "personal" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "personal" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Full Name (as per 10th certificate)</Label><Input name="fullName" value={formData.fullName} onChange={handleChange} data-testid="input-full-name" /></div>
                  <div className="space-y-2"><Label>Father's Name</Label><Input name="fathersName" value={formData.fathersName} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Mother's Name</Label><Input name="mothersName" value={formData.mothersName} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Date of Birth</Label><Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} data-testid="input-dob" /></div>
                  <div className="space-y-2"><Label>Gender</Label><Input name="gender" value={formData.gender} onChange={handleChange} placeholder="Male / Female / Other" /></div>
                  <div className="space-y-2"><Label>Marital Status</Label><Input name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} placeholder="Single / Married" /></div>
                  <div className="space-y-2"><Label>Nationality</Label><Input name="nationality" value={formData.nationality} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Category</Label><Input name="category" value={formData.category} onChange={handleChange} placeholder="UR / OBC / SC / ST / EWS" /></div>
                  <div className="space-y-2"><Label>Disability Status</Label><Input name="disabilityStatus" value={formData.disabilityStatus} onChange={handleChange} placeholder="Yes / No" /></div>
                  <div className="space-y-2"><Label>Disability Type (if applicable)</Label><Input name="disabilityType" value={formData.disabilityType} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Minority Status (if applicable)</Label><Input name="minorityStatus" value={formData.minorityStatus} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Identification Type</Label><Input name="identificationIssueType" value={formData.identificationIssueType} onChange={handleChange} placeholder="Aadhaar / PAN / Voter ID / Passport / DL" /></div>
                  <div className="space-y-2"><Label>Identification Number</Label><Input name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "contact" ? "" : "contact")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Contact</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "contact" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "contact" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Mobile Number</Label><Input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Email ID</Label><Input name="email" type="email" value={formData.email} onChange={handleChange} data-testid="input-email" /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Permanent Address</Label><Textarea name="address" value={formData.address} onChange={handleChange} rows={2} data-testid="input-address" /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Correspondence Address (if different)</Label><Textarea name="correspondenceAddress" value={formData.correspondenceAddress} onChange={handleChange} rows={2} /></div>
                  <div className="space-y-2"><Label>State</Label><Input name="state" value={formData.state} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>District</Label><Input name="district" value={formData.district} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>PIN Code</Label><Input name="pinCode" value={formData.pinCode} onChange={handleChange} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Educational Qualification Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "education" ? "" : "education")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Education</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "education" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "education" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Highest Qualification</Label><Input name="highestQualification" value={formData.highestQualification} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Course / Degree Name</Label><Input name="courseName" value={formData.courseName} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Board / University</Label><Input name="boardUniversity" value={formData.boardUniversity} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Date of Passing</Label><Input name="dateOfPassing" type="date" value={formData.dateOfPassing} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Roll Number / Registration Number</Label><Input name="rollNumber" value={formData.rollNumber} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="percentageCGPA" value={formData.percentageCGPA} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Stream / Subjects</Label><Input name="stream" value={formData.stream} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Additional Qualifications</Label><Input name="additionalQualifications" value={formData.additionalQualifications} onChange={handleChange} placeholder="Computer / Diploma / ITI etc." /></div>
                </div>
              </div>
            )}
          </div>

          {/* Employment Experience Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "experience" ? "" : "experience")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Experience</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "experience" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "experience" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Work Experience</Label><Input name="workExperience" value={formData.workExperience} onChange={handleChange} placeholder="Yes / No" /></div>
                  <div className="space-y-2"><Label>Organization Name</Label><Input name="organizationName" value={formData.organizationName} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Job Title / Post Held</Label><Input name="jobTitle" value={formData.jobTitle} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Start Date</Label><Input name="startDate" type="date" value={formData.startDate} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input name="endDate" type="date" value={formData.endDate} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Total Experience (months/years)</Label><Input name="totalExperience" value={formData.totalExperience} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Salary / Pay Level</Label><Input name="salary" value={formData.salary} onChange={handleChange} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Reservation & Certificates Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "reservation" ? "" : "reservation")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Reservation</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "reservation" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "reservation" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Caste Certificate Number</Label><Input name="casteCertificateNumber" value={formData.casteCertificateNumber} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Caste Certificate Issue Date</Label><Input name="casteCertificateIssueDate" type="date" value={formData.casteCertificateIssueDate} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Issuing Authority</Label><Input name="casteCertificateAuthority" value={formData.casteCertificateAuthority} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>EWS Certificate Number</Label><Input name="ewsCertificateNumber" value={formData.ewsCertificateNumber} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>PwD Medical Certificate</Label><Input name="pwdMedicalCertificate" value={formData.pwdMedicalCertificate} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>NCC Certificate</Label><Input name="nccCertificate" value={formData.nccCertificate} onChange={handleChange} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Ex-Serviceman Details (Service Duration, Discharge Book No.)</Label><Textarea name="exServicemanDetails" value={formData.exServicemanDetails} onChange={handleChange} rows={2} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Domicile Certificate</Label><Textarea name="domicileCertificate" value={formData.domicileCertificate} onChange={handleChange} rows={2} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Exam / Application-Specific Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "exam" ? "" : "exam")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Exam</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "exam" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "exam" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Exam Center Preference (City)</Label><Input name="examCenterPreference" value={formData.examCenterPreference} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Post Preference (if multiple)</Label><Input name="postPreference" value={formData.postPreference} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Language Preference</Label><Input name="languagePreference" value={formData.languagePreference} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>Shift Preference (if applicable)</Label><Input name="shiftPreference" value={formData.shiftPreference} onChange={handleChange} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Declaration Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "declaration" ? "" : "declaration")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Declaration</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "declaration" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "declaration" && (
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Self Declaration</Label>
                  <Textarea name="selfDeclaration" value={formData.selfDeclaration} onChange={handleChange} rows={5} placeholder="Enter your self declaration here..." />
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full mt-6 px-6 py-2 text-base font-semibold"
          data-testid="button-save-profile"
          disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
        >
          {(createProfileMutation.isPending || updateProfileMutation.isPending) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </Card>
    </div>
  );
}
