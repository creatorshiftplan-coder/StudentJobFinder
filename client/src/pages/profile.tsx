import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Save, Loader2, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile, InsertStudentProfile } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSection, setExpandedSection] = useState<string>("personal");
  const [selectedEducationType, setSelectedEducationType] = useState<string>("tenth");

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
    // Educational Qualification - 10th
    tenth_board: "",
    tenth_school: "",
    tenth_percentage: "",
    tenth_passing_date: "",
    tenth_certificate: "",
    // Educational Qualification - 12th
    twelfth_board: "",
    twelfth_stream: "",
    twelfth_school: "",
    twelfth_percentage: "",
    twelfth_passing_date: "",
    twelfth_certificate: "",
    // Educational Qualification - ITI/Diploma
    diploma_trade: "",
    diploma_institute: "",
    diploma_board: "",
    diploma_duration: "",
    diploma_percentage: "",
    diploma_passing_date: "",
    // Educational Qualification - Graduation
    graduation_course: "",
    graduation_university: "",
    graduation_specialization: "",
    graduation_mode: "",
    graduation_percentage: "",
    graduation_passing_date: "",
    // Educational Qualification - Engineering
    engineering_branch: "",
    engineering_university: "",
    engineering_percentage: "",
    engineering_passing_date: "",
    engineering_roll: "",
    // Educational Qualification - Post Graduation
    postgrad_course: "",
    postgrad_university: "",
    postgrad_specialization: "",
    postgrad_percentage: "",
    postgrad_passing_date: "",
    postgrad_roll: "",
    // Educational Qualification - Professional
    professional_degree: "",
    professional_university: "",
    professional_registration: "",
    professional_percentage: "",
    professional_passing_date: "",
    // Educational Qualification - PhD
    phd_subject: "",
    phd_university: "",
    phd_thesis: "",
    phd_award_date: "",
    phd_guide: "",
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
              <span className="text-sm md:text-base font-semibold">Personal Information</span>
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
              <span className="text-sm md:text-base font-semibold">Contact Information</span>
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
              <span className="text-sm md:text-base font-semibold">Educational Qualifications</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${expandedSection === "education" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "education" && (
              <div className="p-6 space-y-6">
                {/* Education Type Dropdown */}
                <div className="space-y-2">
                  <Label>Select Qualification Type</Label>
                  <Select value={selectedEducationType} onValueChange={setSelectedEducationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenth">10th Pass (Matriculation / SSC)</SelectItem>
                      <SelectItem value="twelfth">12th Pass (Higher Secondary / HSC / Intermediate)</SelectItem>
                      <SelectItem value="diploma">ITI / Diploma in Engineering</SelectItem>
                      <SelectItem value="graduation">Graduation (BA, BSc, BCom, BBA, BCA, BSW, etc.)</SelectItem>
                      <SelectItem value="engineering">Engineering Degree (B.Tech / BE in any branch)</SelectItem>
                      <SelectItem value="postgrad">Post Graduation (MA, MSc, BCom, MBA, MCA, MSW, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 10th Pass */}
                {selectedEducationType === "tenth" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Board / Council</Label><Input name="tenth_board" value={formData.tenth_board} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>School Name</Label><Input name="tenth_school" value={formData.tenth_school} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="tenth_percentage" value={formData.tenth_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="tenth_passing_date" type="date" value={formData.tenth_passing_date} onChange={handleChange} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Certificate Number</Label><Input name="tenth_certificate" value={formData.tenth_certificate} onChange={handleChange} /></div>
                  </div>
                </div>
                )}

                {/* 12th Pass */}
                {selectedEducationType === "twelfth" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Board / Council</Label><Input name="twelfth_board" value={formData.twelfth_board} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Stream (Science / Commerce / Arts)</Label><Input name="twelfth_stream" value={formData.twelfth_stream} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>School / College Name</Label><Input name="twelfth_school" value={formData.twelfth_school} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="twelfth_percentage" value={formData.twelfth_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="twelfth_passing_date" type="date" value={formData.twelfth_passing_date} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Certificate Number</Label><Input name="twelfth_certificate" value={formData.twelfth_certificate} onChange={handleChange} /></div>
                  </div>
                </div>
                )}

                {/* ITI / Diploma */}
                {selectedEducationType === "diploma" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Trade / Branch (Electrical / Mechanical / Civil / etc.)</Label><Input name="diploma_trade" value={formData.diploma_trade} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Institute Name</Label><Input name="diploma_institute" value={formData.diploma_institute} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Board / University</Label><Input name="diploma_board" value={formData.diploma_board} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Duration (1 year / 2 year / 3 year)</Label><Input name="diploma_duration" value={formData.diploma_duration} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="diploma_percentage" value={formData.diploma_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="diploma_passing_date" type="date" value={formData.diploma_passing_date} onChange={handleChange} /></div>
                  </div>
                </div>
                )}

                {/* Graduation */}
                {selectedEducationType === "graduation" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Course Name</Label><Input name="graduation_course" value={formData.graduation_course} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>University / College Name</Label><Input name="graduation_university" value={formData.graduation_university} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Specialization</Label><Input name="graduation_specialization" value={formData.graduation_specialization} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Mode (Regular / Distance / Open)</Label><Input name="graduation_mode" value={formData.graduation_mode} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="graduation_percentage" value={formData.graduation_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="graduation_passing_date" type="date" value={formData.graduation_passing_date} onChange={handleChange} /></div>
                  </div>
                </div>
                )}

                {/* Engineering Degree */}
                {selectedEducationType === "engineering" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Branch (CSE / IT / Mechanical / Civil / Electrical / etc.)</Label><Input name="engineering_branch" value={formData.engineering_branch} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>University / Institute</Label><Input name="engineering_university" value={formData.engineering_university} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="engineering_percentage" value={formData.engineering_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="engineering_passing_date" type="date" value={formData.engineering_passing_date} onChange={handleChange} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Registration / Roll Number</Label><Input name="engineering_roll" value={formData.engineering_roll} onChange={handleChange} /></div>
                  </div>
                </div>
                )}

                {/* Post Graduation */}
                {selectedEducationType === "postgrad" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Course Name</Label><Input name="postgrad_course" value={formData.postgrad_course} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>University / College Name</Label><Input name="postgrad_university" value={formData.postgrad_university} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Specialization</Label><Input name="postgrad_specialization" value={formData.postgrad_specialization} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Percentage / CGPA</Label><Input name="postgrad_percentage" value={formData.postgrad_percentage} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Date of Passing (YYYY-MM-DD)</Label><Input name="postgrad_passing_date" type="date" value={formData.postgrad_passing_date} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Registration / Roll Number</Label><Input name="postgrad_roll" value={formData.postgrad_roll} onChange={handleChange} /></div>
                  </div>
                </div>
                )}
              </div>
            )}
          </div>

          {/* Employment Experience Section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "experience" ? "" : "experience")}
              className="w-full flex items-center justify-between px-5 py-3 bg-secondary hover-elevate"
            >
              <span className="text-sm md:text-base font-semibold">Work Experience</span>
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
              <span className="text-sm md:text-base font-semibold">Reservation Details</span>
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
