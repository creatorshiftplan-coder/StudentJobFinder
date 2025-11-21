import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin } from "lucide-react";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  deadline: string;
  description: string;
  salary?: string;
  applied?: boolean;
}

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

export function JobCard({ job, onApply }: JobCardProps) {
  const daysUntilDeadline = Math.ceil(
    (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline > 0;

  return (
    <Card className="p-6 hover-elevate" data-testid={`card-job-${job.id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold" data-testid={`text-job-title-${job.id}`}>{job.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          {job.applied && (
            <Badge variant="secondary" data-testid={`badge-applied-${job.id}`}>Applied</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className={isUrgent ? "text-destructive font-medium" : ""}>
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {job.salary && (
          <p className="text-sm font-medium">{job.salary}</p>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Badge variant="outline">{job.type}</Badge>
          {!job.applied && (
            <Button 
              onClick={() => onApply?.(job.id)}
              data-testid={`button-apply-${job.id}`}
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
