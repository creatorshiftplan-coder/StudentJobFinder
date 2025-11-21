import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import samplePhoto from "@assets/generated_images/sample_student_profile_photo.png";

export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    phone: "+91 9876543210",
    dateOfBirth: "2000-05-15",
    address: "123 Main Street, Mumbai, Maharashtra, India",
    education: "B.Tech Computer Science, XYZ University (2018-2022)",
    skills: "JavaScript, React, Node.js, Python, Data Analysis",
    experience: "Software Developer Intern at ABC Corp (6 months)",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log('Profile saved:', formData);
  };

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
              <AvatarImage src={samplePhoto} alt="Profile" />
              <AvatarFallback>RK</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 rounded-full"
              data-testid="button-upload-photo"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{formData.fullName}</h3>
            <p className="text-sm text-muted-foreground">{formData.email}</p>
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

          <Button onClick={handleSave} className="w-full md:w-auto" data-testid="button-save-profile">
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
