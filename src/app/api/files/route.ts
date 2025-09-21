import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { FileService } from "@/lib/services";
import { RoutePermissionService } from "@/lib/services";
import { S3_CONFIG } from "@/lib/s3";

export async function POST(request: NextRequest) {
  console.log("🚀 [FILES-POST] Starting file metadata save...");

  try {
    const userId = await getCurrentUserId();
    console.log("🔐 [FILES-POST] Auth check:", { userId: userId || "NONE" });

    if (!userId) {
      console.log("❌ [FILES-POST] No user ID found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📥 [FILES-POST] Request body:", {
      projectId: body.projectId,
      filename: body.filename,
      originalName: body.originalName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      s3Key: body.s3Key,
      hasAllFields: !!(
        body.projectId &&
        body.filename &&
        body.originalName &&
        body.fileSize &&
        body.mimeType &&
        body.s3Key
      ),
    });

    const { projectId, filename, originalName, fileSize, mimeType, s3Key } =
      body;

    if (
      !projectId ||
      !filename ||
      !originalName ||
      !fileSize ||
      !mimeType ||
      !s3Key
    ) {
      console.log("❌ [FILES-POST] Missing required fields:", {
        projectId: !!projectId,
        filename: !!filename,
        originalName: !!originalName,
        fileSize: !!fileSize,
        mimeType: !!mimeType,
        s3Key: !!s3Key,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔍 [FILES-POST] Checking project access...");
    // Check if user has permission to upload files (MEMBER or above)
    const { hasAccess, user } = await RoutePermissionService.checkProjectAccess(
      userId,
      projectId,
      "MEMBER"
    );

    console.log("🔑 [FILES-POST] Permission check result:", {
      hasAccess,
      userFound: !!user,
      userId: user?._id?.toString(),
    });

    if (!hasAccess || !user) {
      console.log("❌ [FILES-POST] Access denied to project");
      return NextResponse.json(
        { error: "Insufficient permissions to upload files" },
        { status: 403 }
      );
    }

    console.log("💾 [FILES-POST] Creating file record in database...");
    // Create file record in database
    const fileData = {
      filename,
      originalName,
      fileSize,
      mimeType,
      s3Key,
      s3Bucket: S3_CONFIG.BUCKET_NAME,
      s3Url: undefined, // We'll use presigned URLs for access
      metadata: {
        uploadedVia: "s3-direct",
        uploadedAt: new Date().toISOString(),
      },
      isPublic: false,
      projectId,
      uploadedById: userId, // This will be converted to ObjectId in the service
    };

    console.log("📋 [FILES-POST] File data prepared:", {
      ...fileData,
      uploadedById: "***REDACTED***",
    });

    const savedFile = await FileService.createFile(fileData);
    console.log("✅ [FILES-POST] File saved successfully:", {
      fileId: savedFile._id,
      fileName: savedFile.originalName,
      fileSize: savedFile.fileSize,
    });

    return NextResponse.json({
      fileId: savedFile._id,
      fileName: savedFile.originalName,
      fileSize: savedFile.fileSize,
      mimeType: savedFile.mimeType,
      s3Key: savedFile.s3Key,
      projectId: savedFile.projectId,
      uploadedAt: savedFile.createdAt,
    });
  } catch (error) {
    console.error("💥 [FILES-POST] Error saving file metadata:", error);
    console.error(
      "💥 [FILES-POST] Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      { error: "Failed to save file metadata" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to view files (VIEWER or above)
    const { hasAccess, user, userRole } =
      await RoutePermissionService.checkProjectAccess(
        userId,
        projectId,
        "VIEWER"
      );

    if (!hasAccess || !user) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    const files = await FileService.getFilesByProject(projectId);

    // Filter files based on user role and ownership
    let filteredFiles = files;

    if (userRole === "VIEWER") {
      // VIEWERs can only see files they uploaded OR files marked as public
      filteredFiles = files.filter(
        (file) =>
          file.uploadedById?.toString() === user._id.toString() ||
          file.isPublic === true
      );
    }
    // MEMBER, ADMIN, OWNER can see all files in the project

    console.log("📁 [FILES-GET] File filtering result:", {
      totalFiles: files.length,
      filteredFiles: filteredFiles.length,
      userRole,
      userId: user._id.toString(),
    });

    // Transform files to include permission flags for frontend
    const transformedFiles = filteredFiles.map((file) => {
      const isOwner = file.uploadedById?.toString() === user._id.toString();
      const canDelete = userRole === "OWNER" || isOwner;

      return {
        _id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        s3Key: file.s3Key,
        uploadedById: file.uploadedById,
        createdAt: file.createdAt,
        projectId: file.projectId,
        isOwner,
        uploaderName: `User ${file.uploadedById}`, // You might want to populate this from the user data
        // Add permission flags based on user role and ownership
        permissions: {
          canView: true, // All users with access can view filtered files
          canDownload: ["OWNER", "MEMBER"].includes(userRole || ""),
          canDelete,
        },
      };
    });

    return NextResponse.json({
      files: transformedFiles,
      userPermissions: {
        canUpload: ["OWNER", "MEMBER"].includes(userRole || ""),
        canViewAll: true,
        userRole,
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// DELETE /api/files - Delete a file
export async function DELETE(request: NextRequest) {
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

    // Check if user has permission to delete files
    const { hasAccess, user, userRole } =
      await RoutePermissionService.checkProjectAccess(
        userId,
        projectId,
        "VIEWER" // We need at least viewer to check specific permissions
      );

    if (!hasAccess || !user) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Get file details to check ownership
    const files = await FileService.getFilesByProject(projectId);
    const file = files.find((f) => f._id.toString() === fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user can delete this file
    const canDelete =
      ["OWNER", "ADMIN"].includes(userRole || "") ||
      file.uploadedById?.toString() === user._id.toString();

    if (!canDelete) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this file" },
        { status: 403 }
      );
    }

    // Delete the file
    await FileService.deleteFile(fileId, user._id.toString());

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
