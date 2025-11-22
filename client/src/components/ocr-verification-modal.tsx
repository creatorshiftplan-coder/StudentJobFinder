import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface OCRData {
  [key: string]: string | undefined;
}

interface OCRVerificationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  extractedData: OCRData | null;
  onConfirm: (data: OCRData) => void;
  onCancel: () => void;
}

export function OCRVerificationModal({
  isOpen,
  isLoading,
  extractedData,
  onConfirm,
  onCancel,
}: OCRVerificationModalProps) {
  const [editedData, setEditedData] = useState<OCRData>(extractedData || {});

  const handleValueChange = (key: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const displayFields = [
    { key: "fullName", label: "Full Name" },
    { key: "fathersName", label: "Father's Name" },
    { key: "mothersName", label: "Mother's Name" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "mobileNumber", label: "Mobile Number" },
    { key: "address", label: "Address" },
    { key: "qualification", label: "Qualification" },
    { key: "courseName", label: "Course Name" },
    { key: "boardUniversity", label: "Board/University" },
    { key: "dateOfPassing", label: "Date of Passing" },
    { key: "percentage", label: "Percentage/CGPA" },
    { key: "documentNumber", label: "Document Number" },
    { key: "identificationNumber", label: "Identification Number" },
    { key: "category", label: "Category (UR/OBC/SC/ST/EWS)" },
  ];

  const availableFields = displayFields.filter((f) => editedData[f.key]);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Verify Extracted Information
          </DialogTitle>
          <DialogDescription>
            Please review and verify the information extracted from your document. Edit any fields if needed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Extracting information from document...</span>
          </div>
        ) : availableFields.length === 0 ? (
          <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">No Data Extracted</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                  The system could not extract any information from the document. Please ensure the document is clear and readable.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {availableFields.map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-sm font-medium">
                  {label}
                </Label>
                <Input
                  id={key}
                  value={editedData[key] || ""}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  className="mt-1"
                  data-testid={`input-ocr-${key}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel-ocr"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(editedData)}
            disabled={isLoading || availableFields.length === 0}
            className="px-6 py-2 text-base font-semibold"
            data-testid="button-confirm-ocr"
          >
            Confirm & Update Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
