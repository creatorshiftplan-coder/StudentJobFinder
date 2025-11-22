import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, ExternalLink, Download } from "lucide-react";

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: "pending" | "applied" | "admit_card_released" | "result_released" | "selected" | "rejected";
  deadline?: string;
  admitCardUrl?: string;
  resultUrl?: string;
}

interface ApplicationCardProps {
  application: Application;
  onViewDetails?: (id: string) => void;
}

const statusConfig: Record<Application['status'], { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  pending: { label: "Pending", variant: "secondary" as const },
  applied: { label: "Applied", variant: "default" as const },
  admit_card_released: { label: "Admit Card Released", variant: "default" as const },
  result_released: { label: "Result Released", variant: "default" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
  selected: { label: "Selected", variant: "default" as const },
};

export function ApplicationCard({ application, onViewDetails }: ApplicationCardProps) {
  const status = statusConfig[application.status];

  return (
    <Card className="p-6" data-testid={`card-application-${application.id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold" data-testid={`text-application-title-${application.id}`}>
              {application.jobTitle}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{application.company}</span>
            </div>
          </div>
          <Badge variant={status.variant} data-testid={`badge-status-${application.id}`}>
            {status.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
          </div>
          {application.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Exam: {new Date(application.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          {application.admitCardUrl && (
            <Button 
              variant="outline" 
              onClick={() => console.log('Download admit card')}
              data-testid={`button-admit-card-${application.id}`}
              className="px-6 py-2 text-base font-semibold"
            >
              <Download className="h-5 w-5 mr-2" />
              Admit Card
            </Button>
          )}
          {application.resultUrl && (
            <Button 
              variant="outline" 
              onClick={() => console.log('View result')}
              data-testid={`button-result-${application.id}`}
              className="px-6 py-2 text-base font-semibold"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              View Result
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={() => onViewDetails?.(application.id)}
            data-testid={`button-details-${application.id}`}
            className="px-6 py-2 text-base font-semibold"
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
