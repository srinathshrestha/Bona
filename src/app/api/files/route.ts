import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { FileService } from "@/lib/services";
import { S3_CONFIG } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    const savedFile = await FileService.createFile(fileData);

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
    console.error("Error saving file metadata:", error);
    return NextResponse.json(
      { error: "Failed to save file metadata" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
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

    const files = await FileService.getFilesByProject(projectId);

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
