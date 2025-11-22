import { useState } from "react";
import { ApplicationCard } from "@/components/ApplicationCard";
import { EmptyState } from "@/components/EmptyState";
import { JobCard } from "@/components/JobCard";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Briefcase, Loader2, Plus, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Application, StudentProfile, Job } from "@shared/schema";

export default function Applications() {
  const [activeSection, setActiveSection] = useState<"applications" | "listings">("applications");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [examData, setExamData] = useState({ jobTitle: "", company: "", examDate: "", examTime: "" });
  const { toast } = useToast();

  const { data: profile } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const response = await fetch(`/api/applications/${profile!.id}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  const filterByStatus = (status: string) => {
    if (status === "all") return applications;
    return applications.filter((app) => app.status === status);
  };

  const appliedJobIds = new Set(applications.map((app) => app.jobId));
  
  const jobsWithApplicationStatus = jobs.map((job) => ({
    ...job,
    applied: appliedJobIds.has(job.id),
    applicationStatus: applications.find((app) => app.jobId === job.id)?.status,
  }));

  const isLoading = applicationsLoading || jobsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredApplications = filterByStatus(statusFilter);
  const statusLabels: Record<string, string> = {
    all: `All (${applications.length})`,
    pending: `Pending (${filterByStatus("pending").length})`,
    applied: `Applied (${filterByStatus("applied").length})`,
    admit_card_released: `Admit Card (${filterByStatus("admit_card_released").length})`,
    result_released: `Result (${filterByStatus("result_released").length})`,
    selected: `Selected (${filterByStatus("selected").length})`,
    rejected: `Rejected (${filterByStatus("rejected").length})`,
  };

  const handleAddExam = async () => {
    if (!examData.jobTitle || !examData.company || !examData.examDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: examData.jobTitle,
          company: examData.company,
          examDate: examData.examDate,
          examTime: examData.examTime,
        }),
      });

      if (!response.ok) throw new Error("Failed to add exam");

      toast({ title: "Success", description: "Exam added successfully!" });
      setExamData({ jobTitle: "", company: "", examDate: "", examTime: "" });
      setIsExamDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add exam", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">My Activity</h1>
        <p className="text-muted-foreground mt-2">Track applications and browse job listings</p>
      </div>

      <div className="flex gap-3 border-b pb-0">
        <button
          onClick={() => setActiveSection("applications")}
          className={`px-6 py-3 font-semibold text-lg border-b-4 transition-all hover-elevate ${
            activeSection === "applications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-section-applications"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Applications ({applications.length})
          </div>
        </button>
        <button
          onClick={() => setActiveSection("listings")}
          className={`px-6 py-3 font-semibold text-lg border-b-4 transition-all hover-elevate ${
            activeSection === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-section-listings"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Listings
          </div>
        </button>
      </div>

      {activeSection === "applications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[250px]">
              <h2 className="text-xl font-semibold">Filter by Status</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter" className="w-full md:w-64 px-4 py-3 text-base font-semibold border-2 border-muted rounded-md hover-elevate">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all">
                  All ({applications.length})
                </SelectItem>
                <SelectItem value="pending" data-testid="option-pending">
                  Pending ({filterByStatus("pending").length})
                </SelectItem>
                <SelectItem value="applied" data-testid="option-applied">
                  Applied ({filterByStatus("applied").length})
                </SelectItem>
                <SelectItem value="admit_card_released" data-testid="option-admit-card">
                  Admit Card ({filterByStatus("admit_card_released").length})
                </SelectItem>
                <SelectItem value="result_released" data-testid="option-result-released">
                  Result ({filterByStatus("result_released").length})
                </SelectItem>
                <SelectItem value="selected" data-testid="option-selected">
                  Selected ({filterByStatus("selected").length})
                </SelectItem>
                <SelectItem value="rejected" data-testid="option-rejected">
                  Rejected ({filterByStatus("rejected").length})
                </SelectItem>
              </SelectContent>
            </Select>
            </div>

            <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-exam" className="gap-2 px-6 py-3 text-base font-semibold hover-elevate">
                  <Plus className="h-5 w-5" />
                  Add Exam
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-add-exam" className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Add Exam Schedule
                  </DialogTitle>
                  <DialogDescription>Manually add an exam date and details for your application</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title *</label>
                    <Input
                      placeholder="e.g., Senior Manager"
                      value={examData.jobTitle}
                      onChange={(e) => setExamData({ ...examData, jobTitle: e.target.value })}
                      data-testid="input-exam-job-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company/Organization *</label>
                    <Input
                      placeholder="e.g., HDFC Bank"
                      value={examData.company}
                      onChange={(e) => setExamData({ ...examData, company: e.target.value })}
                      data-testid="input-exam-company"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Date *</label>
                    <Input
                      type="date"
                      value={examData.examDate}
                      onChange={(e) => setExamData({ ...examData, examDate: e.target.value })}
                      data-testid="input-exam-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Time</label>
                    <Input
                      type="time"
                      value={examData.examTime}
                      onChange={(e) => setExamData({ ...examData, examTime: e.target.value })}
                      data-testid="input-exam-time"
                    />
                  </div>
                  <Button
                    onClick={handleAddExam}
                    className="w-full py-3 text-base font-semibold hover-elevate"
                    data-testid="button-save-exam"
                  >
                    Save Exam
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredApplications.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title={`No ${statusFilter === "all" ? "" : statusFilter.replace(/_/g, " ")} applications`}
                description="You have no applications in this status"
                icon={ClipboardList}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onViewDetails={(id) => console.log('View details:', id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Browse Jobs</h2>
            <span className="text-sm text-muted-foreground">{jobsWithApplicationStatus.length} total jobs</span>
          </div>

          {jobsWithApplicationStatus.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No jobs available"
                description="Check back later for new job opportunities"
                icon={Briefcase}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobsWithApplicationStatus.map((job) => (
                <div key={job.id} className="relative">
                  <JobCard 
                    job={job}
                    onApply={(jobId) => console.log('Apply:', jobId)}
                  />
                  {job.applied && job.applicationStatus && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                      {job.applicationStatus.replace(/_/g, " ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
