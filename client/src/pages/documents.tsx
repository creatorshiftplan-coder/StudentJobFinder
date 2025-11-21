import { useState } from "react";
import { DocumentItem } from "@/components/DocumentItem";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import emptyDocsImage from "@assets/generated_images/empty_documents_illustration.png";

export default function Documents() {
  const [documents] = useState([
    {
      id: "1",
      name: "Resume_RajeshKumar.pdf",
      type: "PDF",
      size: "245 KB",
      uploadedDate: "2025-11-20",
    },
    {
      id: "2",
      name: "10th_Certificate.pdf",
      type: "PDF",
      size: "1.2 MB",
      uploadedDate: "2025-11-18",
    },
    {
      id: "3",
      name: "12th_Certificate.pdf",
      type: "PDF",
      size: "980 KB",
      uploadedDate: "2025-11-18",
    },
    {
      id: "4",
      name: "BTech_Degree.pdf",
      type: "PDF",
      size: "1.5 MB",
      uploadedDate: "2025-11-15",
    },
  ]);

  const hasDocuments = documents.length > 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Documents</h1>
          <p className="text-muted-foreground mt-2">Upload and manage your certificates and documents</p>
        </div>
        <Button data-testid="button-upload-document">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {!hasDocuments ? (
        <Card className="p-6">
          <EmptyState
            title="No documents uploaded"
            description="Upload your educational certificates, resume, and other documents to streamline your job applications"
            imageSrc={emptyDocsImage}
            action={{
              label: "Upload Document",
              onClick: () => console.log('Upload clicked'),
            }}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div
              className="border-2 border-dashed border-border rounded-md p-8 text-center hover-elevate cursor-pointer"
              onClick={() => console.log('Upload area clicked')}
              data-testid="area-upload-drop"
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
              <p className="text-sm text-muted-foreground">
                Supports PDF, JPG, PNG up to 10MB
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                onView={(id) => console.log('View:', id)}
                onDownload={(id) => console.log('Download:', id)}
                onDelete={(id) => console.log('Delete:', id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
