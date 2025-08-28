"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileData {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  uploadedById: string;
  createdAt: string;
  projectId: string;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canDelete: boolean;
  };
}

interface FileViewerProps {
  file: FileData | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper function to get file type category
const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("text/") || mimeType.includes("json")) return "text";
  return "other";
};

export function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Video/Audio controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Image viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get download URL for the file
  const fetchFileUrl = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 [FILE-VIEWER] Fetching download URL for:", file.filename);

      const response = await fetch(
        `/api/files/download?fileId=${file._id}&projectId=${file.projectId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get file URL");
      }

      const data = await response.json();
      setFileUrl(data.downloadUrl);
      console.log("✅ [FILE-VIEWER] File URL fetched successfully");
    } catch (error) {
      console.error("❌ [FILE-VIEWER] Error fetching file URL:", error);
      setError(error instanceof Error ? error.message : "Failed to load file");
      toast.error("Failed to load file");
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  // Load file URL when file changes
  useEffect(() => {
    if (file && isOpen) {
      fetchFileUrl();
    } else {
      setFileUrl(null);
      setError(null);
      resetViewerState();
    }
  }, [file, isOpen, fetchFileUrl]);

  // Reset viewer state when file changes
  const resetViewerState = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setZoom(1);
    setRotation(0);
  };

  // Media event handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };
  const handleDurationChange = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  // Media controls
  const togglePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Image controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const resetImageView = () => {
    setZoom(1);
    setRotation(0);
  };

  // Download file
  const handleDownload = async () => {
    if (!file || !file.permissions.canDownload) {
      toast.error("You don't have permission to download this file");
      return;
    }

    try {
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = file.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  // Format time for media controls
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!file) return null;

  const fileCategory = getFileCategory(file.mimeType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {file.originalName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                File viewer for {file.originalName}
              </DialogDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <Badge variant="outline">{file.mimeType}</Badge>
                <span>{formatFileSize(file.fileSize)}</span>
                <span>
                  Uploaded {formatDistanceToNow(new Date(file.createdAt))} ago
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file.permissions.canDownload && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  disabled={!fileUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading file...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load file</p>
                <p className="text-sm opacity-75">{error}</p>
                <Button
                  onClick={fetchFileUrl}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {fileUrl && !isLoading && !error && (
            <>
              {/* Image Viewer */}
              {fileCategory === "image" && (
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 rounded-lg border">
                  <div className="flex items-center justify-center gap-2 p-3 border-b bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                    <Button
                      onClick={handleZoomOut}
                      size="sm"
                      variant="outline"
                      disabled={zoom <= 0.25}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[70px] text-center font-mono">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      onClick={handleZoomIn}
                      size="sm"
                      variant="outline"
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-2" />
                    <Button onClick={handleRotate} size="sm" variant="outline">
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={resetImageView}
                      size="sm"
                      variant="outline"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                    <div className="w-full h-full min-h-[400px] flex items-center justify-center p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={fileUrl}
                        alt={file.originalName}
                        className="transition-transform duration-200 ease-in-out"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transformOrigin: "center center",
                          maxWidth: zoom <= 1 ? "100%" : "none",
                          maxHeight: zoom <= 1 ? "100%" : "none",
                          objectFit: "contain",
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Video Player */}
              {fileCategory === "video" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 bg-black flex items-center justify-center">
                    <video
                      ref={mediaRef as React.RefObject<HTMLVideoElement>}
                      src={fileUrl}
                      className="max-w-full max-h-full"
                      controls
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={handleDurationChange}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {fileCategory === "audio" && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md">
                    <audio
                      ref={mediaRef as React.RefObject<HTMLAudioElement>}
                      src={fileUrl}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={handleDurationChange}
                      className="hidden"
                    />

                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Volume2 className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">
                        {file.originalName}
                      </h3>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: duration
                              ? `${(currentTime / duration) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>

                      {/* Time display */}
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          onClick={togglePlayPause}
                          size="lg"
                          className="rounded-full w-12 h-12"
                        >
                          {isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </Button>
                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          size="sm"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Unsupported file type */}
              {!["image", "video", "audio"].includes(fileCategory) && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      Preview not available
                    </h3>
                    <p className="text-gray-500 mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    {file.permissions.canDownload && (
                      <Button onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
