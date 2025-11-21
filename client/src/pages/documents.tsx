import { useRef } from "react";
import { DocumentItem } from "@/components/DocumentItem";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document, StudentProfile } from "@shared/schema";

export default function Documents() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const response = await fetch(`/api/documents/${profile!.id}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", profile!.id);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", profile?.id] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", profile?.id] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      uploadMutation.mutate(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  const hasDocuments = documents.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Documents</h1>
          <p className="text-muted-foreground mt-2">Upload and manage your certificates and documents</p>
        </div>
        <Button
          data-testid="button-upload-document"
          onClick={handleUploadClick}
          disabled={uploadMutation.isPending || !profile}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Upload
        </Button>
      </div>

      {!hasDocuments ? (
        <Card className="p-6">
          <EmptyState
            title="No documents uploaded"
            description="Upload your educational certificates, resume, and other documents to streamline your job applications"
            action={{
              label: "Upload Document",
              onClick: handleUploadClick,
            }}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div
              className="border-2 border-dashed border-border rounded-md p-8 text-center hover-elevate cursor-pointer"
              onClick={handleUploadClick}
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
                onView={(id) => window.open(documents.find(d => d.id === id)?.url, '_blank')}
                onDownload={(id) => {
                  const doc = documents.find(d => d.id === id);
                  if (doc) {
                    const link = document.createElement('a');
                    link.href = doc.url;
                    link.download = doc.name;
                    link.click();
                  }
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
