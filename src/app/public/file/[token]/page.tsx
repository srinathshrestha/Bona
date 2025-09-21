"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PublicFile {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    username?: string;
    displayName?: string;
  };
  createdAt: string;
  downloadUrl: string;
  formattedSize: string;
  fileType: string;
}

interface PublicFilePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function PublicFilePage({ params }: PublicFilePageProps) {
  const [file, setFile] = useState<PublicFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(
          `/api/public/file/${resolvedParams.token}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch file");
        }

        const data = await response.json();
        setFile(data.file);
      } catch (err) {
        console.error("Error fetching file:", err);
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [params]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case "video":
        return <Video className="w-8 h-8 text-purple-500" />;
      case "audio":
        return <Music className="w-8 h-8 text-green-500" />;
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "archive":
        return <Archive className="w-8 h-8 text-orange-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleDownload = () => {
    if (file?.downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              File Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              {error ||
                "The file you're looking for doesn't exist or is no longer publicly accessible."}
            </p>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Public File</span>
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Public
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="flex items-center space-x-4">
            {getFileIcon(file.fileType)}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {file.originalName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {file.formattedSize} • {file.mimeType}
              </p>
            </div>
          </div>

          {/* File Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                <span>Uploaded by</span>
              </div>
              <span className="font-medium">
                {file.uploadedBy?.displayName ||
                  file.uploadedBy?.username ||
                  "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Uploaded</span>
              </div>
              <span className="font-medium">
                {formatDistanceToNow(new Date(file.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This file is shared publicly via Bona</p>
            <p className="mt-1">
              <a href="/" className="text-primary hover:underline">
                Learn more about Bona
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
