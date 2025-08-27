import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { FileService } from "@/lib/services";
import { RoutePermissionService } from "@/lib/services";
import { getDownloadPresignedUrl } from "@/lib/s3";

// GET /api/files/download - Get download URL for a file
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
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

    // Check if user has permission to download files (MEMBER or above)
    const { hasAccess, user } = await RoutePermissionService.checkProjectAccess(
      userId,
      projectId,
      "MEMBER"
    );

    if (!hasAccess || !user) {
      return NextResponse.json(
        { error: "Insufficient permissions to download files" },
        { status: 403 }
      );
    }

    // Get file details
    const files = await FileService.getFilesByProject(projectId);
    const file = files.find((f) => f._id.toString() === fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate download URL
    const downloadUrl = await getDownloadPresignedUrl(
      file.s3Key,
      file.originalName,
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      downloadUrl,
      filename: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
