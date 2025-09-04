"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Files,
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Loader2,
  Eye,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { FileUploadS3 } from "./file-upload-s3";
import { FileViewer } from "./file-viewer";

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

interface UserPermissions {
  canUpload: boolean;
  canViewAll: boolean;
  userRole: string;
}

interface ProjectFileManagerProps {
  projectId: string;
  userRole?: string;
  trigger?: React.ReactNode;
}

export function ProjectFileManager({
  projectId,
  userRole,
  trigger,
}: ProjectFileManagerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    canUpload:
      userRole === "OWNER" || userRole === "ADMIN" || userRole === "MEMBER",
    canViewAll: true,
    userRole: userRole || "VIEWER",
  });
  const [loading, setLoading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // File viewer state
  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files?projectId=${projectId}`);

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setUserPermissions(
          data.userPermissions || {
            canUpload:
              userRole === "OWNER" ||
              userRole === "ADMIN" ||
              userRole === "MEMBER",
            canViewAll: true,
            userRole: userRole || "VIEWER",
          }
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, fetchFiles]);

  const handleDownload = async (file: FileData) => {
    try {
      const response = await fetch(
        `/api/files/download?fileId=${file._id}&projectId=${projectId}`
      );

      if (response.ok) {
        const data = await response.json();
        // Create a temporary link to download the file
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = file.originalName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloaded ${file.originalName}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Handle file viewing
  const handleViewFile = (file: FileData) => {
    if (!file.permissions.canView) {
      toast.error("You don't have permission to view this file");
      return;
    }
    setViewingFile(file);
    setShowFileViewer(true);
  };

  // Close file viewer
  const handleCloseFileViewer = () => {
    setShowFileViewer(false);
    setViewingFile(null);
  };

  const handleDelete = async (file: FileData) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }

    try {
      setDeletingFileId(file._id);
      const response = await fetch(
        `/api/files?fileId=${file._id}&projectId=${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        toast.success(`Deleted ${file.originalName}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileName?: string) => {
    const iconClass = "h-5 w-5";

    // Image files
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className={iconClass} />;
    }

    // Video files
    if (mimeType.startsWith("video/")) {
      return <Video className={iconClass} />;
    }

    // Audio files
    if (mimeType.startsWith("audio/")) {
      return <Music className={iconClass} />;
    }

    // PDF files
    if (
      mimeType === "application/pdf" ||
      fileName?.toLowerCase().endsWith(".pdf")
    ) {
      return <FileText className={`${iconClass} text-red-600`} />;
    }

    // Excel files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      fileName?.toLowerCase().match(/\.(xlsx?|csv)$/)
    ) {
      return <FileSpreadsheet className={`${iconClass} text-green-600`} />;
    }

    // PowerPoint files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      mimeType === "application/vnd.ms-powerpoint" ||
      fileName?.toLowerCase().match(/\.(pptx?|pps|ppsx)$/)
    ) {
      return <Presentation className={`${iconClass} text-orange-600`} />;
    }

    // Word documents
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      fileName?.toLowerCase().match(/\.(docx?|rtf)$/)
    ) {
      return <FileText className={`${iconClass} text-blue-600`} />;
    }

    // Archive files
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar") ||
      mimeType.includes("gzip") ||
      fileName?.toLowerCase().match(/\.(zip|rar|tar|gz|7z)$/)
    ) {
      return <Archive className={iconClass} />;
    }

    // Text files
    if (
      mimeType.startsWith("text/") ||
      fileName
        ?.toLowerCase()
        .match(/\.(txt|md|json|xml|html|css|js|ts|jsx|tsx)$/)
    ) {
      return <FileText className={iconClass} />;
    }

    // Default file icon
    return <File className={iconClass} />;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "MEMBER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "VIEWER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Files className="h-4 w-4 mr-2" />
      Files ({files.length})
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <Files className="h-5 w-5" />
              <span>Project Files</span>
            </div>
            <Badge
              className={`${getRoleBadgeColor(
                userPermissions.userRole
              )} text-xs`}
            >
              {userPermissions.userRole}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage and organize your project files. Your permissions are based
            on your role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Section */}
          {userPermissions.canUpload && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Upload Files</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {showUpload ? "Hide Upload" : "Show Upload"}
                </Button>
              </div>

              {showUpload && (
                <FileUploadS3
                  projectId={projectId}
                  userRole={userRole}
                  onUploadComplete={() => {
                    fetchFiles();
                    setShowUpload(false);
                  }}
                />
              )}
            </div>
          )}

          {/* Permission Info */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Permissions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      userPermissions.canViewAll ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  View Files
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ["OWNER", "ADMIN", "MEMBER"].includes(
                        userPermissions.userRole
                      )
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Download Files
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      userPermissions.canUpload ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  Upload Files
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ["OWNER", "ADMIN"].includes(userPermissions.userRole)
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Delete Files
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Project Files ({files.length})</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && files.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Files className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No files uploaded yet</p>
                  {userPermissions.canUpload && (
                    <p className="text-sm mt-1">
                      Upload your first file to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {/* File info section */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file.mimeType, file.originalName)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm sm:text-base">
                            {file.originalName}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span className="hidden sm:inline">
                              {formatDistanceToNow(new Date(file.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <span className="sm:hidden">
                              {formatDistanceToNow(new Date(file.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile-friendly permissions and actions section */}
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        {/* Permission indicators - hide on mobile to save space */}
                        <div className="hidden sm:flex items-center gap-1">
                          {file.permissions.canDownload && (
                            <Badge variant="secondary" className="text-xs">
                              Download
                            </Badge>
                          )}
                          {file.permissions.canDelete && (
                            <Badge variant="secondary" className="text-xs">
                              Delete
                            </Badge>
                          )}
                        </div>

                        {/* Action buttons - responsive */}
                        <div className="flex items-center gap-1">
                          {file.permissions.canView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFile(file)}
                              title="View file"
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          {file.permissions.canDownload && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              title="Download file"
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          {file.permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file)}
                              disabled={deletingFileId === file._id}
                              className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                              title="Delete file"
                            >
                              {deletingFileId === file._id ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          )}
                          {!file.permissions.canDownload &&
                            !file.permissions.canDelete && (
                              <div className="text-xs text-gray-500 px-2 hidden sm:block">
                                View only
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* File Viewer */}
      <FileViewer
        file={viewingFile}
        isOpen={showFileViewer}
        onClose={handleCloseFileViewer}
      />
    </Dialog>
  );
}
