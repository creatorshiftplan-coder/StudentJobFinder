import { StatsCard } from "@/components/StatsCard";
import { ApplicationCard } from "@/components/ApplicationCard";
import { JobCard } from "@/components/JobCard";
import { Briefcase, Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Application, Job, StudentProfile } from "@shared/schema";

export default function Dashboard() {
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
  });

  const stats = [
    {
      title: "Total Applications",
      value: applications.length,
      icon: Briefcase,
      description: "All time",
    },
    {
      title: "Pending",
      value: applications.filter((a) => a.status === "pending").length,
      icon: Clock,
      description: "Awaiting response",
    },
  ];

  const recentApplications = applications
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 2);

  const recommendedJobs = jobs.slice(0, 3);

  if (applicationsLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your application overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Applications</h2>
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onViewDetails={(id) => console.log('View details:', id)}
              />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Recommended Jobs</h2>
          <div className="space-y-4">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={(id) => console.log('Apply to:', id)}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No jobs available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
