import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Crop } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Photo() {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>("passport");

  const dimensions = [
    { id: "passport", label: "Passport Size", size: "35mm x 45mm" },
    { id: "id-card", label: "ID Card", size: "25mm x 30mm" },
    { id: "resume", label: "Resume Photo", size: "200px x 200px" },
    { id: "custom", label: "Custom", size: "Define size" },
  ];

  const handleUpload = () => {
    console.log('Upload photo clicked');
    setUploadedPhoto("https://via.placeholder.com/200x250");
  };

  const handleCrop = () => {
    console.log('Crop to:', selectedDimension);
  };

  const handleDownload = () => {
    console.log('Download photo');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">Photo</h1>
        <p className="text-muted-foreground mt-2">Upload and resize your photo for job applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Photo</h3>
          <div
            className="border-2 border-dashed border-border rounded-md p-8 text-center hover-elevate cursor-pointer"
            onClick={handleUpload}
            data-testid="area-upload-photo"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Click to upload photo</h3>
            <p className="text-sm text-muted-foreground">
              JPG, PNG up to 5MB
            </p>
          </div>

          {uploadedPhoto && (
            <div className="mt-6">
              <div className="border border-border rounded-md p-4 bg-background">
                <img 
                  src={uploadedPhoto} 
                  alt="Uploaded" 
                  className="max-w-full h-auto mx-auto"
                  data-testid="img-uploaded-photo"
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Photo Dimensions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select the required dimension for your application
          </p>
          
          <div className="space-y-2">
            {dimensions.map((dim) => (
              <div
                key={dim.id}
                className={`p-4 border rounded-md cursor-pointer hover-elevate ${
                  selectedDimension === dim.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setSelectedDimension(dim.id)}
                data-testid={`option-dimension-${dim.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{dim.label}</p>
                    <p className="text-sm text-muted-foreground">{dim.size}</p>
                  </div>
                  {selectedDimension === dim.id && (
                    <Badge>Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <Button 
              className="flex-1"
              disabled={!uploadedPhoto}
              onClick={handleCrop}
              data-testid="button-crop-photo"
            >
              <Crop className="h-4 w-4 mr-2" />
              Crop & Resize
            </Button>
            <Button
              variant="outline"
              disabled={!uploadedPhoto}
              onClick={handleDownload}
              data-testid="button-download-photo"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
