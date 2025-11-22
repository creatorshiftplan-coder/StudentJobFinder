import { useState } from "react";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Briefcase, Loader2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

export default function Jobs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", searchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (filterType !== "all") params.append("type", filterType);
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/jobs/scrape-official", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to scrape jobs");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: `Found and added ${data.count} new jobs from official government sources`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to scrape jobs. Please try again.",
        variant: "destructive",
      });
    },
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
          <Button
            onClick={() => scrapeMutation.mutate()}
            disabled={scrapeMutation.isPending || isLoading}
            variant="outline"
            data-testid="button-refresh-jobs"
            title="Refresh jobs from official government sources"
          >
            {scrapeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {scrapeMutation.isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No jobs found"
            description="Try adjusting your search or filters to find more opportunities"
            icon={Briefcase}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
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
