import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile, InsertStudentProfile } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  });

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    if (profile) {
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

  const handleSave = () => {
    const data: InsertStudentProfile = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      education: formData.education,
      skills: formData.skills,
      experience: formData.experience,
      photoUrl: formData.photoUrl,
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                data-testid="input-full-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                data-testid="input-dob"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              data-testid="input-address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education</Label>
            <Textarea
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              rows={3}
              data-testid="input-education"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows={2}
              placeholder="e.g., JavaScript, Python, Communication"
              data-testid="input-skills"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Work Experience</Label>
            <Textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows={3}
              data-testid="input-experience"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full md:w-auto"
            data-testid="button-save-profile"
            disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
          >
            {(createProfileMutation.isPending || updateProfileMutation.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
