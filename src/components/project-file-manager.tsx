"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Share,
  Copy,
  ExternalLink,
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { FileUploadS3 } from "./file-upload-s3";
import { FileViewer } from "./file-viewer";

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
  s3Url?: string;
  cloudinaryUrl?: string;
  isPublic?: boolean;
  publicShareToken?: string;
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
    canUpload: userRole === "OWNER" || userRole === "MEMBER",
    canViewAll: true,
    userRole: userRole || "VIEWER",
  });
  const [loading, setLoading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // File viewer state
  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  // Sorting and renaming state
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files?projectId=${projectId}`);

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setUserPermissions(
          data.userPermissions || {
            canUpload: userRole === "OWNER" || userRole === "MEMBER",
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
  }, [projectId, userRole]);

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

  const handleTogglePublicSharing = async (file: FileData) => {
    if (userRole !== "OWNER" && userRole !== "MEMBER") {
      toast.error("Only owners and members can make files public");
      return;
    }

    try {
      const response = await fetch(`/api/files/${file._id}/public`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublic: !file.isPublic,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);

        // Copy share URL to clipboard if making public
        if (data.shareUrl) {
          await navigator.clipboard.writeText(data.shareUrl);
          toast.success("Public link copied to clipboard!");
        }

        await fetchFiles(); // Refresh the file list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update file sharing");
      }
    } catch (error) {
      console.error("Error toggling public sharing:", error);
      toast.error("Failed to update file sharing");
    }
  };

  const copyPublicLink = async (file: FileData) => {
    if (!file.isPublic || !file.publicShareToken) {
      toast.error("File is not publicly shared");
      return;
    }

    const publicUrl = `${window.location.origin}/public/file/${file.publicShareToken}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleRenameFile = async (file: FileData, newName: string) => {
    if (!newName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }

    if (
      userRole !== "OWNER" &&
      file.uploadedById !== userPermissions.userRole
    ) {
      toast.error("You can only rename files you uploaded");
      return;
    }

    try {
      const response = await fetch(`/api/files?fileId=${file._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalName: newName.trim(),
        }),
      });

      if (response.ok) {
        toast.success("File renamed successfully");
        await fetchFiles(); // Refresh the file list
        setRenamingFileId(null);
        setNewFileName("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to rename file");
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Failed to rename file");
    }
  };

  const startRename = (file: FileData) => {
    setRenamingFileId(file._id);
    setNewFileName(file.originalName);
  };

  const cancelRename = () => {
    setRenamingFileId(null);
    setNewFileName("");
  };

  const sortFiles = (files: FileData[]): FileData[] => {
    return [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "size":
          comparison = a.fileSize - b.fileSize;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string, filename?: string) => {
    const iconClass =
      "h-5 w-5 group-hover:text-white dark:group-hover:text-white";

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
      filename?.toLowerCase().endsWith(".pdf")
    ) {
      return (
        <FileText
          className={`${iconClass} text-red-600 group-hover:text-white dark:group-hover:text-white`}
        />
      );
    }

    // Excel files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      filename?.toLowerCase().match(/\.(xlsx?|csv)$/)
    ) {
      return (
        <FileSpreadsheet
          className={`${iconClass} text-green-600 group-hover:text-white dark:group-hover:text-white`}
        />
      );
    }

    // PowerPoint files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      mimeType === "application/vnd.ms-powerpoint" ||
      filename?.toLowerCase().match(/\.(pptx?|pps|ppsx)$/)
    ) {
      return (
        <Presentation
          className={`${iconClass} text-orange-600 group-hover:text-white dark:group-hover:text-white`}
        />
      );
    }

    // Word documents
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      filename?.toLowerCase().match(/\.(docx?|rtf)$/)
    ) {
      return (
        <FileText
          className={`${iconClass} text-blue-600 group-hover:text-white dark:group-hover:text-white`}
        />
      );
    }

    // Archive files
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar") ||
      mimeType.includes("gzip") ||
      filename?.toLowerCase().match(/\.(zip|rar|tar|gz|7z)$/)
    ) {
      return <Archive className={iconClass} />;
    }

    // Text files
    if (
      mimeType.startsWith("text/") ||
      filename
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
    <>
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
                        userPermissions.canViewAll
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    View Files
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        ["OWNER", "MEMBER"].includes(userPermissions.userRole)
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    Download Files
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        userPermissions.canUpload
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    Upload Files
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        ["OWNER"].includes(userPermissions.userRole)
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
                    {/* Sorting Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Sort by:</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select
                          value={sortBy}
                          onValueChange={(value: "name" | "date" | "size") =>
                            setSortBy(value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                Name
                              </div>
                            </SelectItem>
                            <SelectItem value="date">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date
                              </div>
                            </SelectItem>
                            <SelectItem value="size">
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4" />
                                Size
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          }
                          className="w-20"
                        >
                          {sortOrder === "asc" ? (
                            <>
                              <ArrowUp className="h-4 w-4 mr-1" />
                              Asc
                            </>
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 mr-1" />
                              Desc
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {sortFiles(files).map((file) => (
                      <div
                        key={file._id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
                      >
                        {/* File info section */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(file.mimeType, file.originalName)}
                          <div className="flex-1 min-w-0">
                            {renamingFileId === file._id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newFileName}
                                  onChange={(e) =>
                                    setNewFileName(e.target.value)
                                  }
                                  className="text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleRenameFile(file, newFileName);
                                    } else if (e.key === "Escape") {
                                      cancelRename();
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleRenameFile(file, newFileName)
                                  }
                                  className="h-8"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelRename}
                                  className="h-8"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <p className="font-medium truncate text-sm sm:text-base group-hover:text-white dark:group-hover:text-white">
                                {file.originalName}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 dark:group-hover:text-gray-300">
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
                            {(userRole === "OWNER" ||
                              file.uploadedById ===
                                userPermissions.userRole) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startRename(file)}
                                title="Rename file"
                                className="h-8 w-8 sm:h-9 sm:w-9 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-950"
                              >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                            {(userRole === "OWNER" ||
                              userRole === "MEMBER") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePublicSharing(file)}
                                title={
                                  file.isPublic ? "Make private" : "Make public"
                                }
                                className={`h-8 w-8 sm:h-9 sm:w-9 ${
                                  file.isPublic
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-950"
                                }`}
                              >
                                {file.isPublic ? (
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                                ) : (
                                  <Share className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            )}
                            {file.isPublic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPublicLink(file)}
                                title="Copy public link"
                                className="h-8 w-8 sm:h-9 sm:w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                              >
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
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
      </Dialog>

      {/* File Viewer - Outside main dialog to prevent nested dialog issues */}
      <FileViewer
        file={viewingFile}
        isOpen={showFileViewer}
        onClose={handleCloseFileViewer}
      />
    </>
  );
}
