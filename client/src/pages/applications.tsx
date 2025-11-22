import { useState } from "react";
import { ApplicationCard } from "@/components/ApplicationCard";
import { EmptyState } from "@/components/EmptyState";
import { JobCard } from "@/components/JobCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Briefcase, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Application, StudentProfile, Job } from "@shared/schema";

export default function Applications() {
  const [activeSection, setActiveSection] = useState<"applications" | "listings">("applications");

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">My Activity</h1>
        <p className="text-muted-foreground mt-2">Track applications and browse job listings</p>
      </div>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveSection("applications")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === "applications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-section-applications"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Applications ({applications.length})
          </div>
        </button>
        <button
          onClick={() => setActiveSection("listings")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-section-listings"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Listings
          </div>
        </button>
      </div>

      {activeSection === "applications" && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 max-w-4xl overflow-x-auto">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({filterByStatus("pending").length})
            </TabsTrigger>
            <TabsTrigger value="applied" data-testid="tab-applied">
              Applied ({filterByStatus("applied").length})
            </TabsTrigger>
            <TabsTrigger value="admit_card_released" data-testid="tab-admit-card">
              Admit Card ({filterByStatus("admit_card_released").length})
            </TabsTrigger>
            <TabsTrigger value="result_released" data-testid="tab-result-released">
              Result ({filterByStatus("result_released").length})
            </TabsTrigger>
            <TabsTrigger value="selected" data-testid="tab-selected">
              Selected ({filterByStatus("selected").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({filterByStatus("rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {applications.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No applications yet"
                  description="Start applying to jobs to track your application status here"
                  icon={ClipboardList}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onViewDetails={(id) => console.log('View details:', id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {["pending", "applied", "admit_card_released", "result_released", "selected", "rejected"].map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              {filterByStatus(status).length === 0 ? (
                <Card className="p-6">
                  <EmptyState
                    title={`No ${status.replace(/_/g, " ")} applications`}
                    description="You have no applications in this status"
                    icon={ClipboardList}
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filterByStatus(status).map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onViewDetails={(id) => console.log('View details:', id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
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
