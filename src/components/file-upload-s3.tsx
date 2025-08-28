"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, File, X, CheckCircle } from "lucide-react";

interface UploadedFileData {
  fileId: string;
  fileName: string;
  fileUrl: string;
  projectId: string;
  uploadedAt: string;
}

interface FileUploadS3Props {
  projectId: string;
  disabled?: boolean;
  onUploadComplete?: (files: UploadedFileData[]) => void;
  userRole?: string; // Add user role to check permissions
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export function FileUploadS3({
  projectId,
  disabled = false,
  onUploadComplete,
  userRole,
}: FileUploadS3Props) {
  const router = useRouter();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Check if user can upload (MEMBER or above)
  const canUpload = userRole && ["OWNER", "ADMIN", "MEMBER"].includes(userRole);
  const isDisabled = disabled || !canUpload;

  // Upload individual file
  const uploadFile = useCallback(
    async (uploadingFile: UploadingFile) => {
      console.log("🚀 [CLIENT-UPLOAD] Starting file upload:", {
        fileName: uploadingFile.file.name,
        fileSize: uploadingFile.file.size,
        fileType: uploadingFile.file.type,
        projectId,
      });

      try {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, status: "uploading" } : f
          )
        );

        console.log("📡 [CLIENT-UPLOAD] Step 1: Requesting presigned URL...");
        // Step 1: Get presigned URL
        const presignResponse = await fetch("/api/files/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            filename: uploadingFile.file.name,
            contentType: uploadingFile.file.type,
            fileSize: uploadingFile.file.size,
          }),
        });

        console.log("📡 [CLIENT-UPLOAD] Presigned URL response:", {
          status: presignResponse.status,
          statusText: presignResponse.statusText,
          ok: presignResponse.ok,
        });

        if (!presignResponse.ok) {
          const errorData = await presignResponse.json();
          console.error(
            "❌ [CLIENT-UPLOAD] Failed to get upload URL:",
            errorData
          );
          throw new Error(errorData.error || "Failed to get upload URL");
        }

        const { uploadUrl, s3Key } = await presignResponse.json();
        console.log("✅ [CLIENT-UPLOAD] Got presigned URL:", {
          s3Key,
          urlLength: uploadUrl.length,
          urlHost: new URL(uploadUrl).hostname,
        });

        // Step 2: Upload to S3 with progress tracking
        console.log("☁️ [CLIENT-UPLOAD] Step 2: Uploading to S3...");
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            console.log("📊 [CLIENT-UPLOAD] Upload progress:", progress + "%");
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadingFile.id ? { ...f, progress } : f
              )
            );
          }
        });

        xhr.addEventListener("load", async () => {
          console.log("☁️ [CLIENT-UPLOAD] S3 upload completed:", {
            status: xhr.status,
            statusText: xhr.statusText,
            responseHeaders: xhr.getAllResponseHeaders(),
          });

          if (xhr.status === 200) {
            // Step 3: Save file metadata to database
            console.log("💾 [CLIENT-UPLOAD] Step 3: Saving file metadata...");
            try {
              const metadataResponse = await fetch("/api/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  projectId,
                  filename: uploadingFile.file.name,
                  originalName: uploadingFile.file.name,
                  fileSize: uploadingFile.file.size,
                  mimeType: uploadingFile.file.type,
                  s3Key,
                }),
              });

              console.log("💾 [CLIENT-UPLOAD] Metadata save response:", {
                status: metadataResponse.status,
                statusText: metadataResponse.statusText,
                ok: metadataResponse.ok,
              });

              if (!metadataResponse.ok) {
                const errorData = await metadataResponse.json();
                console.error(
                  "❌ [CLIENT-UPLOAD] Failed to save file metadata:",
                  errorData
                );
                throw new Error(
                  errorData.error || "Failed to save file metadata"
                );
              }

              const savedFile = await metadataResponse.json();
              console.log(
                "✅ [CLIENT-UPLOAD] File metadata saved successfully:",
                {
                  fileId: savedFile.fileId,
                  fileName: savedFile.fileName,
                }
              );

              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, status: "completed", progress: 100 }
                    : f
                )
              );

              toast.success(
                `${uploadingFile.file.name} uploaded successfully!`
              );

              if (onUploadComplete) {
                onUploadComplete([savedFile]);
              }
            } catch (error) {
              console.error(
                "💥 [CLIENT-UPLOAD] Error saving file metadata:",
                error
              );
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? {
                        ...f,
                        status: "error",
                        error: "Failed to save file metadata",
                      }
                    : f
                )
              );
              toast.error(`Failed to save ${uploadingFile.file.name}`);
            }
          } else {
            console.error("❌ [CLIENT-UPLOAD] S3 upload failed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText,
            });
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        });

        xhr.addEventListener("error", (event) => {
          console.error("💥 [CLIENT-UPLOAD] S3 upload error event:", event);
          console.error("💥 [CLIENT-UPLOAD] XMLHttpRequest details:", {
            status: xhr.status,
            statusText: xhr.statusText,
            readyState: xhr.readyState,
            responseText: xhr.responseText,
            responseURL: xhr.responseURL,
            getAllResponseHeaders: xhr.getAllResponseHeaders(),
          });
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? {
                    ...f,
                    status: "error",
                    error: "Upload failed",
                  }
                : f
            )
          );
          toast.error(`Failed to upload ${uploadingFile.file.name}`);
        });

        xhr.addEventListener("abort", () => {
          console.warn("⚠️ [CLIENT-UPLOAD] S3 upload aborted");
        });

        xhr.addEventListener("timeout", () => {
          console.error("⏰ [CLIENT-UPLOAD] S3 upload timed out");
        });

        console.log("🔄 [CLIENT-UPLOAD] Sending file to S3...");
        console.log("🔄 [CLIENT-UPLOAD] Upload URL details:", {
          url: uploadUrl,
          method: "PUT",
          contentType: uploadingFile.file.type,
          fileSize: uploadingFile.file.size,
          fileName: uploadingFile.file.name,
        });
        
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", uploadingFile.file.type);
        xhr.setRequestHeader("x-amz-server-side-encryption", "AES256");

        console.log("🔄 [CLIENT-UPLOAD] XMLHttpRequest configured:", {
          readyState: xhr.readyState,
          timeout: xhr.timeout,
          withCredentials: xhr.withCredentials,
        });
        
        xhr.send(uploadingFile.file);
      } catch (error) {
        console.error("💥 [CLIENT-UPLOAD] Upload error:", error);
        console.error(
          "💥 [CLIENT-UPLOAD] Error stack:",
          error instanceof Error ? error.stack : "No stack"
        );
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
        toast.error(`Failed to upload ${uploadingFile.file.name}`);
      }
    },
    [projectId, onUploadComplete]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newFiles: UploadingFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: "pending",
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Start uploading files
      newFiles.forEach(uploadFile);
    },
    [uploadFile]
  );

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (isDisabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [isDisabled, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDisabled) {
        setIsDragging(true);
      }
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Clear completed uploads
  const clearCompletedUploads = () => {
    setUploadingFiles((prev) => prev.filter((f) => f.status !== "completed"));
    router.refresh(); // Refresh to show new files
  };

  const getStatusIcon = (status: UploadingFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <File className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Permission check message */}
      {!canUpload && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Upload className="h-4 w-4" />
              <p className="text-sm">
                You need MEMBER role or above to upload files. Current role:{" "}
                {userRole || "VIEWER"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 hover:border-gray-400"
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!isDisabled) {
            document.getElementById("file-input")?.click();
          }
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isDisabled
            ? "You don't have permission to upload files"
            : "Drag and drop files here, or click to browse"}
        </p>
        <p className="text-sm text-gray-500">Maximum file size: 100MB</p>

        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          disabled={isDisabled}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Upload Progress</h4>
            {uploadingFiles.some((f) => f.status === "completed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompletedUploads}
              >
                Clear Completed
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-3">
                {getStatusIcon(file.status)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                  </div>

                  {file.status === "uploading" && (
                    <div className="mt-1">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {file.progress}% uploaded
                      </p>
                    </div>
                  )}

                  {file.status === "error" && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}

                  {file.status === "completed" && (
                    <p className="text-xs text-green-500 mt-1">
                      Upload completed
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === "uploading"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
