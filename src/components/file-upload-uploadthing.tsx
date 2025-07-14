"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { OurFileRouter } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";

interface FileUploadProps {
  projectId: string;
  disabled?: boolean;
}

interface UploadedFileInfo {
  fileId: string;
  fileName: string;
  fileUrl: string;
  projectId: string;
  uploadedBy: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
  };
}

export function FileUploadUploadThing({
  projectId,
  disabled = false,
}: FileUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);

  const handleUploadComplete = (
    res: ClientUploadedFileData<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      projectId: string;
      uploadedBy: {
        id: string;
        displayName: string | null;
        username: string | null;
        avatar: string | null;
      };
    }>[]
  ) => {
    console.log("Files uploaded:", res);

    // Transform UploadThing response to our format
    const transformedFiles: UploadedFileInfo[] = res.map((file) => ({
      fileId: file.serverData?.fileId || file.key,
      fileName: file.serverData?.fileName || file.name,
      fileUrl: file.serverData?.fileUrl || file.url,
      projectId: file.serverData?.projectId || "",
      uploadedBy: {
        id: file.serverData?.uploadedBy?.id || "",
        displayName: file.serverData?.uploadedBy?.displayName || "Unknown",
        username: file.serverData?.uploadedBy?.username || "unknown",
        avatar: file.serverData?.uploadedBy?.avatar || "",
      },
    }));

    setUploadedFiles((prev) => [...prev, ...transformedFiles]);
    setIsUploading(false);

    // Show success toast
    toast.success(
      `Successfully uploaded ${res.length} file${res.length > 1 ? "s" : ""}!`
    );

    // Refresh the page to show the new files
    router.refresh();
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setIsUploading(false);

    // Show error toast
    toast.error(`Upload failed: ${error.message}`);
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disabled ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Upload Disabled
              </h3>
              <p className="text-muted-foreground">
                You do not have permission to upload files to this project
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* UploadThing Dropzone */}
              <UploadDropzone<OurFileRouter, "projectFileUploader">
                endpoint="projectFileUploader"
                config={{
                  mode: "manual",
                }}
                input={{ projectId }}
                onClientUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadBegin={() => {
                  setIsUploading(true);
                  console.log("Upload beginning...");
                }}
                appearance={{
                  container:
                    "border-2 border-dashed border-primary/25 rounded-lg p-8 hover:border-primary/50 transition-colors",
                  uploadIcon: "text-primary w-12 h-12",
                  label: "text-foreground font-semibold text-lg",
                  allowedContent: "text-muted-foreground",
                  button:
                    "bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-md transition-colors ut-ready:bg-primary ut-uploading:bg-primary/50 ut-uploading:cursor-not-allowed",
                }}
                content={{
                  label: "Drop files here or click to browse",
                  allowedContent:
                    "Images, videos, audio, documents and archives",
                  button: isUploading ? "Uploading..." : "Choose Files",
                }}
              />

              {/* Alternative Upload Button */}
              <div className="text-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>

              <div className="flex justify-center">
                <UploadButton<OurFileRouter, "projectFileUploader">
                  endpoint="projectFileUploader"
                  input={{ projectId }}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  onUploadBegin={() => {
                    setIsUploading(true);
                    console.log("Upload beginning...");
                  }}
                  appearance={{
                    button:
                      "bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-md transition-colors ut-ready:bg-primary ut-uploading:bg-primary/50",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Quick Upload
                      </>
                    ),
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Status */}
          {isUploading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  Uploading files...
                </span>
              </div>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                Please wait while your files are being uploaded and processed.
              </p>
            </div>
          )}

          {/* File Limits Info */}
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>
              <strong>File Limits:</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• Images: Up to 32MB</div>
              <div>• Videos: Up to 512MB</div>
              <div>• Audio: Up to 64MB</div>
              <div>• Documents: Up to 32MB</div>
              <div>• Archives: Up to 128MB</div>
              <div>• Text files: Up to 4MB</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Recently Uploaded ({uploadedFiles.length})
              </div>
              <Button variant="ghost" size="sm" onClick={clearUploadedFiles}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.fileId}-${index}`}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded by{" "}
                        {file.uploadedBy.displayName ||
                          file.uploadedBy.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
