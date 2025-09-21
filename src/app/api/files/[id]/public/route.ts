import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { FileService } from "@/lib/services/file.service";

// PUT /api/files/[id]/public - Toggle public sharing for a file
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isPublic } = await request.json();

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "isPublic must be a boolean" },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const result = await FileService.togglePublicSharing(
      resolvedParams.id,
      userId,
      isPublic
    );

    return NextResponse.json({
      success: true,
      isPublic,
      shareUrl: result.shareUrl,
      message: isPublic
        ? "File is now publicly accessible"
        : "File is no longer publicly accessible",
    });
  } catch (error) {
    console.error("Error toggling public sharing:", error);

    if (error instanceof Error) {
      if (error.message === "File not found") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      if (error.message === "Insufficient permissions") {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update file sharing settings" },
      { status: 500 }
    );
  }
}
