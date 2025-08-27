import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUploadPresignedUrl, validateFile } from "@/lib/s3";
import { RoutePermissionService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, filename, contentType, fileSize } = body;

    if (!projectId || !filename || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has permission to upload files to this project
    const { hasAccess, user } = await RoutePermissionService.checkProjectAccess(
      userId,
      projectId,
      "MEMBER" // Members and above can upload files
    );

    if (!hasAccess || !user) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Validate file
    const validation = validateFile(filename, contentType, fileSize);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate presigned URL
    const { uploadUrl, s3Key, expiresIn } = await getUploadPresignedUrl(
      projectId,
      filename,
      contentType,
      fileSize
    );

    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
