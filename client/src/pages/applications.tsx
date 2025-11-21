import { useState } from "react";
import { ApplicationCard } from "@/components/ApplicationCard";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";

export default function Applications() {
  const [applications] = useState([
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
      company: "Analytics Corp",
      appliedDate: "2025-11-15",
      status: "pending" as const,
    },
    {
      id: "3",
      jobTitle: "Frontend Developer",
      company: "WebDev Studios",
      appliedDate: "2025-11-10",
      status: "rejected" as const,
    },
    {
      id: "4",
      jobTitle: "Backend Developer",
      company: "Cloud Systems",
      appliedDate: "2025-11-05",
      status: "selected" as const,
      resultUrl: "#",
    },
  ]);

  const filterByStatus = (status: string) => {
    if (status === "all") return applications;
    return applications.filter((app) => app.status === status);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Applications</h1>
        <p className="text-muted-foreground mt-2">Track your job application status and deadlines</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({filterByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="shortlisted" data-testid="tab-shortlisted">
            Shortlisted ({filterByStatus("shortlisted").length})
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
                action={{
                  label: "Browse Jobs",
                  onClick: () => console.log('Browse jobs clicked'),
                }}
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

        {["pending", "shortlisted", "selected", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterByStatus(status).map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onViewDetails={(id) => console.log('View details:', id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
