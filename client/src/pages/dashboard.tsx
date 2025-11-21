import { StatsCard } from "@/components/StatsCard";
import { ApplicationCard } from "@/components/ApplicationCard";
import { JobCard } from "@/components/JobCard";
import { Briefcase, ClipboardList, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const stats = [
    { title: "Total Applications", value: 12, icon: Briefcase, description: "Submitted this month" },
    { title: "Pending", value: 5, icon: Clock, description: "Awaiting response" },
    { title: "Shortlisted", value: 4, icon: ClipboardList, description: "Interview scheduled" },
    { title: "Selected", value: 1, icon: CheckCircle, description: "Job offers" },
  ];

  const recentApplications = [
    {
      id: "1",
      jobTitle: "Software Engineer",
      company: "Tech Solutions Ltd",
      appliedDate: "2025-11-18",
      status: "shortlisted" as const,
      deadline: "2025-12-25",
      admitCardUrl: "#",
    },
    {
      id: "2",
      jobTitle: "Data Analyst",
      company: "Data Corp",
      appliedDate: "2025-11-15",
      status: "pending" as const,
    },
  ];

  const upcomingJobs = [
    {
      id: "3",
      title: "Junior Developer",
      company: "StartUp Inc",
      location: "Bangalore, India",
      type: "Full-time",
      deadline: "2025-11-30",
      description: "Exciting opportunity to work with cutting-edge technologies in a dynamic startup environment.",
      salary: "₹5-7 LPA",
      applied: false,
    },
  ];

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
            {upcomingJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={(id) => console.log('Apply to:', id)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
