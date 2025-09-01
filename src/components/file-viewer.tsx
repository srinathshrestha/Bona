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
  FileSpreadsheet,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Simple text file viewer component
const TextFileViewer = ({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName?: string;
}) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load text file"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTextContent();
  }, [fileUrl]);

  // Detect file type for basic styling
  const getFileType = (name?: string, content?: string) => {
    if (!name && !content) return 'text';
    
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) return 'html';
    if (lowerName.endsWith('.css')) return 'css';
    if (lowerName.endsWith('.js') || lowerName.endsWith('.jsx')) return 'javascript';
    if (lowerName.endsWith('.ts') || lowerName.endsWith('.tsx')) return 'typescript';
    if (lowerName.endsWith('.json')) return 'json';
    if (lowerName.endsWith('.xml')) return 'xml';
    if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) return 'markdown';
    
    // Detect by content if no filename
    if (content?.trim().startsWith('<!DOCTYPE') || content?.includes('<html')) return 'html';
    if (content?.trim().startsWith('{') || content?.trim().startsWith('[')) return 'json';
    
    return 'text';
  };

  const fileType = getFileType(fileName, content);

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <p>Loading content...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-32">
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    </div>
  );

  const isLargeFile = content.length > 10000;
  const displayContent = showFullContent || !isLargeFile 
    ? content 
    : content.substring(0, 10000);

  return (
    <div className="h-full flex flex-col">
      {/* File info and controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="capitalize px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
            {fileType}
          </span>
          <span>{content.length.toLocaleString()} characters</span>
          {isLargeFile && !showFullContent && (
            <span className="text-yellow-600">• Showing first 10,000 characters</span>
          )}
        </div>
        {isLargeFile && (
          <Button
            onClick={() => setShowFullContent(!showFullContent)}
            size="sm"
            variant="outline"
          >
            {showFullContent ? 'Show Less' : 'Show All'}
          </Button>
        )}
      </div>
      
      {/* Content area with proper scrolling */}
      <div className="flex-1 overflow-auto">
        <pre className="whitespace-pre-wrap text-sm p-4 font-mono leading-relaxed break-words overflow-wrap-anywhere min-h-full">
          {displayContent}
          {isLargeFile && !showFullContent && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                ... File content truncated for performance. Click &quot;Show All&quot; to view the complete file.
              </p>
            </div>
          )}
        </pre>
      </div>
    </div>
  );
};

interface FileData {
  _id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  uploadedById: string;
  createdAt: string;
  projectId: string;
  s3Url?: string;
  cloudinaryUrl?: string;
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
const getFileCategory = (mimeType: string, fileName?: string): string => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";

  // PDF files
  if (
    mimeType === "application/pdf" ||
    fileName?.toLowerCase().endsWith(".pdf")
  )
    return "pdf";

  // Excel files
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    fileName?.toLowerCase().match(/\.(xlsx?|csv)$/)
  )
    return "excel";

  // PowerPoint files
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    fileName?.toLowerCase().match(/\.(pptx?|pps|ppsx)$/)
  )
    return "powerpoint";

  // Word documents
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    fileName?.toLowerCase().match(/\.(docx?|rtf)$/)
  )
    return "word";

  // Text files
  if (mimeType.includes("text/") || mimeType.includes("json")) return "text";

  return "other";
};

// PDF Viewer component with multiple fallback options
const PDFViewer = ({ fileUrl, fileName, file }: { fileUrl: string; fileName: string; file: FileData }) => {
  const [viewMode, setViewMode] = useState<'iframe' | 'embed' | 'google' | 'download'>('iframe');
  const [hasError, setHasError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Fetch download URL as fallback
  useEffect(() => {
    const fetchDownloadUrl = async () => {
      try {
        const response = await fetch(`/api/files/download?fileId=${file._id}&projectId=${file.projectId}`);
        if (response.ok) {
          const data = await response.json();
          setDownloadUrl(data.downloadUrl);
        }
      } catch (error) {
        console.error("Failed to fetch download URL:", error);
      }
    };
    
    if (file) {
      fetchDownloadUrl();
    }
  }, [file]);

  // Try iframe first, then fall back to other methods
  const handleIframeError = () => {
    console.log("🔄 [PDF-VIEWER] Iframe failed, trying embed...");
    setHasError(true);
    setViewMode('embed');
  };

  const handleEmbedError = () => {
    console.log("🔄 [PDF-VIEWER] Embed failed, trying Google Docs viewer...");
    setViewMode('google');
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const downloadFile = () => {
    const urlToUse = downloadUrl || fileUrl;
    const link = document.createElement('a');
    link.href = urlToUse;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col">
      {/* PDF Viewer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-gray-800 border-b rounded-t-lg gap-3 sm:gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="font-medium text-sm truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap sm:gap-2">
          <Button
            onClick={() => setViewMode('iframe')}
            size="sm"
            variant={viewMode === 'iframe' ? 'default' : 'outline'}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            Direct
          </Button>
          <Button
            onClick={() => setViewMode('google')}
            size="sm"
            variant={viewMode === 'google' ? 'default' : 'outline'}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            Google
          </Button>
          <Button 
            onClick={openInNewTab} 
            size="sm" 
            variant="outline"
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Open</span>
          </Button>
          <Button 
            onClick={downloadFile} 
            size="sm" 
            variant="outline"
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative">
        {viewMode === 'iframe' && (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
            onError={handleIframeError}
            onLoad={() => {
              console.log("✅ [PDF-VIEWER] Iframe loaded successfully");
              setHasError(false);
            }}
          />
        )}

        {viewMode === 'embed' && (
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full"
            onError={handleEmbedError}
          />
        )}

        {viewMode === 'google' && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl || fileUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={fileName}
            onError={() => setViewMode('download')}
          />
        )}

        {viewMode === 'download' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4 sm:p-8 max-w-md mx-auto">
              <FileText className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">PDF Preview Unavailable</h3>
              <p className="text-gray-500 mb-6 text-sm sm:text-base">
                Unable to preview this PDF file in the browser. You can download it or open it in a new tab.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={downloadFile} variant="default" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={openInNewTab} variant="outline" className="w-full sm:w-auto">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        )}

        {hasError && viewMode === 'iframe' && (
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-yellow-600 mb-4">Direct preview failed. Trying alternative method...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
      console.log("🔍 [FILE-VIEWER] Fetching download URL for:", file.fileName);

      // Determine which endpoint to use based on file type
      const fileCategory = getFileCategory(file.mimeType, file.fileName);
      const endpoint = fileCategory === 'pdf' 
        ? `/api/files/view?fileId=${file._id}&projectId=${file.projectId}`
        : `/api/files/download?fileId=${file._id}&projectId=${file.projectId}`;

      console.log(`🔗 [FILE-VIEWER] Using ${fileCategory === 'pdf' ? 'view' : 'download'} endpoint for ${fileCategory} file`);

      const response = await fetch(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get file URL");
      }

      const data = await response.json();
      const url = data.viewUrl || data.downloadUrl;
      setFileUrl(url);
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

  const fileCategory = getFileCategory(file.mimeType, file.fileName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[98vw] sm:w-[95vw] h-[98vh] sm:h-[95vh] flex flex-col p-0 m-1 sm:m-4">
        <DialogHeader className="flex-shrink-0 p-3 sm:p-6 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{file.originalName}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                File viewer for {file.originalName}
              </DialogDescription>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{file.mimeType}</Badge>
                  <span>{formatFileSize(file.fileSize)}</span>
                </div>
                <span className="hidden sm:inline">
                  Uploaded {formatDistanceToNow(new Date(file.createdAt))} ago
                </span>
                <span className="sm:hidden">
                  {formatDistanceToNow(new Date(file.createdAt))} ago
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {file.permissions.canDownload && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  disabled={!fileUrl}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm" className="px-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-6 pb-2 sm:pb-6">
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
                  <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <div 
                      className="absolute inset-0 overflow-auto"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(0,0,0,0.3) transparent"
                      }}
                    >
                      <div 
                        className="flex items-center justify-center p-4"
                        style={{
                          minWidth: "100%",
                          minHeight: "100%",
                          width: zoom > 1 ? `${zoom * 100}%` : "100%",
                          height: zoom > 1 ? `${zoom * 100}%` : "100%",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          ref={imageRef}
                          src={fileUrl}
                          alt={file.originalName}
                          className="transition-transform duration-200 ease-in-out block"
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

              {/* PDF Viewer */}
              {fileCategory === "pdf" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg relative">
                    <PDFViewer fileUrl={fileUrl} fileName={file.originalName} file={file} />
                  </div>
                </div>
              )}

              {/* Excel Viewer */}
              {fileCategory === "excel" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 sm:p-8 max-w-md mx-auto">
                    <FileSpreadsheet className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 truncate">
                      {file.originalName}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm sm:text-base">
                      Excel files can be viewed by downloading or opening in
                      Excel Online
                    </p>
                    <div className="flex flex-col gap-3 justify-center">
                      <Button
                        onClick={() => window.open(fileUrl, "_blank")}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                              fileUrl
                            )}`,
                            "_blank"
                          )
                        }
                        variant="default"
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Excel Online
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* PowerPoint Viewer */}
              {fileCategory === "powerpoint" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 sm:p-8 max-w-md mx-auto">
                    <FileImage className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-4 text-orange-600" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 truncate">
                      {file.originalName}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm sm:text-base">
                      PowerPoint files can be viewed by downloading or opening
                      in PowerPoint Online
                    </p>
                    <div className="flex flex-col gap-3 justify-center">
                      <Button
                        onClick={() => window.open(fileUrl, "_blank")}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                              fileUrl
                            )}`,
                            "_blank"
                          )
                        }
                        variant="default"
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in PowerPoint Online
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Word Document Viewer */}
              {fileCategory === "word" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 sm:p-8 max-w-md mx-auto">
                    <FileText className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 truncate">
                      {file.originalName}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm sm:text-base">
                      Word documents can be viewed by downloading or opening in
                      Word Online
                    </p>
                    <div className="flex flex-col gap-3 justify-center">
                      <Button
                        onClick={() => window.open(fileUrl, "_blank")}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                              fileUrl
                            )}`,
                            "_blank"
                          )
                        }
                        variant="default"
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Word Online
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Text File Viewer */}
              {fileCategory === "text" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                    <TextFileViewer fileUrl={fileUrl} fileName={file.originalName} />
                  </div>
                </div>
              )}

              {/* Unsupported file type */}
              {![
                "image",
                "video",
                "audio",
                "pdf",
                "excel",
                "powerpoint",
                "word",
                "text",
              ].includes(fileCategory) && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4 sm:p-8 max-w-md mx-auto">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg sm:text-lg font-semibold mb-2">
                      Preview not available
                    </h3>
                    <p className="text-gray-500 mb-4 text-sm sm:text-base">
                      This file type cannot be previewed in the browser.
                    </p>
                    {file.permissions.canDownload && (
                      <Button onClick={handleDownload} className="w-full sm:w-auto">
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
