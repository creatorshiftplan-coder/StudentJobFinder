import { useState } from "react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Signature() {
  const [savedSignature, setSavedSignature] = useState<string | undefined>();

  const handleSave = (dataUrl: string) => {
    setSavedSignature(dataUrl);
    console.log('Signature saved');
  };

  const handleDownload = () => {
    if (!savedSignature) return;
    const link = document.createElement('a');
    link.href = savedSignature;
    link.download = 'signature.png';
    link.click();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Signature</h1>
        <p className="text-muted-foreground mt-2">Create and save your digital signature for applications</p>
      </div>

      <Tabs defaultValue="draw" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="draw" data-testid="tab-draw">Draw Signature</TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Draw Your Signature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use your mouse or touchscreen to draw your signature in the box below
            </p>
            <SignatureCanvas onSave={handleSave} initialSignature={savedSignature} />
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Signature Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a scanned or photographed signature (PNG, JPG)
            </p>
            <div
              className="border-2 border-dashed border-border rounded-md p-8 text-center hover-elevate cursor-pointer"
              onClick={() => console.log('Upload signature clicked')}
              data-testid="area-upload-signature"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Click to upload signature</h3>
              <p className="text-sm text-muted-foreground">
                Recommended: White background, 300x100 pixels
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {savedSignature && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Saved Signature</h3>
            <Button variant="outline" onClick={handleDownload} data-testid="button-download-signature">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="border border-border rounded-md p-4 bg-background flex items-center justify-center">
            <img src={savedSignature} alt="Saved signature" className="max-h-32" data-testid="img-saved-signature" />
          </div>
        </Card>
      )}
    </div>
  );
}
