import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { FileService } from "@/lib/services";
import { RoutePermissionService } from "@/lib/services";
import { getViewPresignedUrl } from "@/lib/s3";

// GET /api/files/view - Get view URL for a file (for inline viewing/preview)
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const projectId = searchParams.get("projectId");

    if (!fileId || !projectId) {
      return NextResponse.json(
        { error: "File ID and Project ID are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to view files (MEMBER or above)
    const { hasAccess, user } = await RoutePermissionService.checkProjectAccess(
      userId,
      projectId,
      "MEMBER"
    );

    if (!hasAccess || !user) {
      return NextResponse.json(
        { error: "Insufficient permissions to view files" },
        { status: 403 }
      );
    }

    // Get file details
    const files = await FileService.getFilesByProject(projectId);
    const file = files.find((f) => f._id.toString() === fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate view URL (inline viewing)
    const viewUrl = await getViewPresignedUrl(
      file.s3Key,
      file.mimeType,
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      viewUrl,
      downloadUrl: viewUrl, // For backward compatibility
      filename: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating view URL:", error);
    return NextResponse.json(
      { error: "Failed to generate view URL" },
      { status: 500 }
    );
  }
}
