"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}: FileUploadS3Props) {
  const router = useRouter();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
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
  }, []);

  // Upload individual file
  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id ? { ...f, status: "uploading" } : f
        )
      );

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

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, s3Key } = await presignResponse.json();

      // Step 2: Upload to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, progress } : f
            )
          );
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          // Step 3: Save file metadata to database
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

            if (!metadataResponse.ok) {
              throw new Error("Failed to save file metadata");
            }

            const savedFile = await metadataResponse.json();

            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadingFile.id
                  ? { ...f, status: "completed", progress: 100 }
                  : f
              )
            );

            toast.success(`${uploadingFile.file.name} uploaded successfully!`);

            if (onUploadComplete) {
              onUploadComplete([savedFile]);
            }
          } catch (error) {
            console.error("Error saving file metadata:", error);
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
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener("error", () => {
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

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", uploadingFile.file.type);
      xhr.send(uploadingFile.file);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      toast.error(`Failed to upload ${uploadingFile.file.name}`);
    }
  };

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
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
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled) {
            document.getElementById("file-input")?.click();
          }
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">Maximum file size: 100MB</p>

        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          disabled={disabled}
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
