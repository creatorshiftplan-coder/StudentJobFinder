import { useState } from "react";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import emptyJobsImage from "@assets/generated_images/empty_jobs_illustration.png";

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const jobs = [
    {
      id: "1",
      title: "Software Engineer",
      company: "Tech Solutions Ltd",
      location: "Bangalore, India",
      type: "Full-time",
      deadline: "2025-11-28",
      description: "We are seeking a talented Software Engineer to join our team. You will work on cutting-edge projects using modern technologies.",
      salary: "₹8-12 LPA",
      applied: false,
    },
    {
      id: "2",
      title: "Data Analyst",
      company: "Analytics Corp",
      location: "Hyderabad, India",
      type: "Full-time",
      deadline: "2025-12-05",
      description: "Looking for a skilled Data Analyst to help us make data-driven decisions. Experience with Python and SQL required.",
      salary: "₹6-9 LPA",
      applied: true,
    },
    {
      id: "3",
      title: "Frontend Developer",
      company: "WebDev Studios",
      location: "Mumbai, India",
      type: "Contract",
      deadline: "2025-12-10",
      description: "Join our creative team to build beautiful and responsive web applications. React and TypeScript expertise needed.",
      salary: "₹7-10 LPA",
      applied: false,
    },
    {
      id: "4",
      title: "Junior Backend Developer",
      company: "Cloud Systems",
      location: "Pune, India",
      type: "Full-time",
      deadline: "2025-12-15",
      description: "Great opportunity for fresh graduates. Work with Node.js, databases, and cloud technologies.",
      salary: "₹5-7 LPA",
      applied: false,
    },
  ];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || job.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Job Listings</h1>
        <p className="text-muted-foreground mt-2">Browse and apply to job opportunities</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-jobs"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-job-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filteredJobs.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No jobs found"
            description="Try adjusting your search or filters to find more opportunities"
            icon={Briefcase}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={(id) => console.log('Apply to job:', id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
