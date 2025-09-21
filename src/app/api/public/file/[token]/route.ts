import { NextRequest, NextResponse } from "next/server";
import { FileService } from "@/lib/services/file.service";
import { getDownloadPresignedUrl } from "@/lib/s3";

// GET /api/public/file/[token] - Get public file information and download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const file = await FileService.getFileByPublicToken(resolvedParams.token);

    if (!file) {
      return NextResponse.json(
        { error: "File not found or not publicly accessible" },
        { status: 404 }
      );
    }

    // Generate signed URL for download
    const downloadUrl = await getDownloadPresignedUrl(
      file.s3Key,
      file.originalName,
      3600
    ); // 1 hour expiry

    return NextResponse.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedById,
        createdAt: file.createdAt,
        downloadUrl,
        formattedSize: file.getFormattedSize(),
        fileType: file.getFileType(),
      },
    });
  } catch (error) {
    console.error("Error fetching public file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}
