import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUploadPresignedUrl, validateFile } from "@/lib/s3";
import { RoutePermissionService } from "@/lib/services";

export async function POST(request: NextRequest) {
  console.log("🚀 [UPLOAD-URL] Starting upload URL generation...");

  try {
    const userId = await getCurrentUserId();
    console.log("🔐 [UPLOAD-URL] Auth check:", { userId: userId || "NONE" });

    if (!userId) {
      console.log("❌ [UPLOAD-URL] No user ID found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📥 [UPLOAD-URL] Request body:", {
      projectId: body.projectId,
      filename: body.filename,
      contentType: body.contentType,
      fileSize: body.fileSize,
      hasAllFields: !!(
        body.projectId &&
        body.filename &&
        body.contentType &&
        body.fileSize
      ),
    });

    const { projectId, filename, contentType, fileSize } = body;

    if (!projectId || !filename || !contentType || !fileSize) {
      console.log("❌ [UPLOAD-URL] Missing required fields:", {
        projectId: !!projectId,
        filename: !!filename,
        contentType: !!contentType,
        fileSize: !!fileSize,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔍 [UPLOAD-URL] Checking project access...");
    // Check if user has permission to upload files to this project
    const { hasAccess, user } = await RoutePermissionService.checkProjectAccess(
      userId,
      projectId,
      "MEMBER" // Members and above can upload files
    );

    console.log("🔑 [UPLOAD-URL] Permission check result:", {
      hasAccess,
      userFound: !!user,
      userId: user?._id?.toString(),
    });

    if (!hasAccess || !user) {
      console.log("❌ [UPLOAD-URL] Access denied to project");
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    console.log("✅ [UPLOAD-URL] File validation...");
    // Validate file
    const validation = validateFile(filename, contentType, fileSize);
    console.log("📋 [UPLOAD-URL] File validation result:", validation);

    if (!validation.isValid) {
      console.log("❌ [UPLOAD-URL] File validation failed:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    console.log("🔄 [UPLOAD-URL] Generating presigned URL...");
    // Generate presigned URL
    const { uploadUrl, s3Key, expiresIn } = await getUploadPresignedUrl(
      projectId,
      filename,
      contentType,
      fileSize
    );

    console.log("✅ [UPLOAD-URL] Presigned URL generated successfully:", {
      s3Key,
      expiresIn,
      urlLength: uploadUrl.length,
    });

    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn,
    });
  } catch (error) {
    console.error("💥 [UPLOAD-URL] Error generating upload URL:", error);
    console.error(
      "💥 [UPLOAD-URL] Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
