import { useRef } from "react";
import { DocumentItem } from "@/components/DocumentItem";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document, StudentProfile, REQUIRED_DOCUMENTS } from "@shared/schema";

// Smart document matching with keyword detection
function smartDocumentMatch(uploadedFileName: string, requiredDocType: string): boolean {
  const fileName = uploadedFileName.toLowerCase().replace(/\.[^/.]+$/, ""); // Remove extension
  const reqDoc = requiredDocType.toLowerCase();

  // Define keyword patterns for each document type
  const docPatterns: Record<string, string[]> = {
    "photo": ["photo", "passport", "recent", "profile_pic", "profilepic", "pp", "pic"],
    "signature": ["signature", "sign", "sig"],
    "thumb": ["thumb", "fingerprint", "impression", "thumbprint"],
    "10th": ["10th", "tenth", "matriculation", "sslc", "board_exam", "x_", "class_10"],
    "12th": ["12th", "twelfth", "intermediate", "hsc", "class_12", "senior_secondary"],
    "graduation": ["graduation", "degree", "bachelor", "btech", "bca", "bsc", "bcom", "ba", "graduate", "diploma"],
    "caste": ["caste", "sc", "st", "obc", "ur", "general", "category", "reservation"],
    "ews": ["ews", "economically", "weaker"],
    "pwd": ["pwd", "disability", "handicap", "medical", "certificate", "ph", "difabled"],
    "experience": ["experience", "work_exp", "workexp", "employment", "job_letter", "certificate_of_experience"],
    "identity": ["identity", "aadhaar", "aadhar", "pan", "voter", "passport", "dl", "driving", "license", "id", "proof"],
    "ncc": ["ncc", "national_cadet"],
    "domicile": ["domicile", "residence", "inhabitant"],
    "serviceman": ["serviceman", "ex_service", "exservice", "discharge", "service", "military", "armed"],
  };

  // Check for exact phrase matches first
  const exactMatches: Record<string, string[]> = {
    "photo (recent passport size)": ["photo"],
    "signature": ["signature"],
    "thumb impression (if required)": ["thumb"],
    "10th marksheet / certificate": ["10th"],
    "12th marksheet / certificate": ["12th"],
    "graduation certificate / diploma": ["graduation", "diploma"],
    "caste / ews / pwd certificates": ["caste", "ews", "pwd"],
    "experience certificate (if applicable)": ["experience"],
    "identity proof scan (aadhaar / pan / voter id / passport / dl)": ["identity", "aadhaar", "pan", "voter", "passport", "dl"],
  };

  // Get patterns for this required doc
  const patterns = exactMatches[reqDoc] || [];
  
  // Check if any pattern keywords match the filename
  for (const pattern of patterns) {
    const keywords = docPatterns[pattern] || [pattern];
    for (const keyword of keywords) {
      if (fileName.includes(keyword)) {
        return true;
      }
    }
  }

  // Fallback: simple substring match
  return fileName.includes(reqDoc.split("/")[0].trim().substring(0, 10));
}

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

  const requiredDocs = ["Photo (Recent Passport Size)", "Signature", "Thumb Impression (if required)", "10th Marksheet / Certificate", "12th Marksheet / Certificate", "Graduation Certificate / Diploma", "Caste / EWS / PwD certificates", "Experience certificate (if applicable)", "Identity proof scan (Aadhaar / PAN / Voter ID / Passport / DL)"];
  
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
          <p className="text-muted-foreground mt-2">Upload required certificates and documents</p>
        </div>
        <Button
          data-testid="button-upload-document"
          onClick={handleUploadClick}
          disabled={uploadMutation.isPending || !profile}
          className="px-6 py-2 text-base font-semibold"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Upload
        </Button>
      </div>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Documents Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredDocs.map((doc) => {
              const isUploaded = documents.some(d => smartDocumentMatch(d.name, doc));
              return (
                <div key={doc} className="flex items-center gap-2 p-2 rounded bg-white dark:bg-slate-800">
                  {isUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={isUploaded ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                    {doc}
                  </span>
                  {isUploaded && <Badge variant="secondary" className="ml-auto text-xs">Done</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

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
