import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Trash2 } from "lucide-react";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  url?: string;
}

interface DocumentItemProps {
  document: Document;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DocumentItem({ document, onView, onDownload, onDelete }: DocumentItemProps) {
  return (
    <Card className="p-4" data-testid={`card-document-${document.id}`}>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate" data-testid={`text-document-name-${document.id}`}>
            {document.name}
          </h4>
          <p className="text-sm text-muted-foreground">
            {document.type} • {document.size} • {new Date(document.uploadedDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView?.(document.id)}
            data-testid={`button-view-${document.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload?.(document.id)}
            data-testid={`button-download-${document.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(document.id)}
            data-testid={`button-delete-${document.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
