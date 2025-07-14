import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ProjectService, UserService } from "@/lib/database";
import { S3Service, FileTypeUtils } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for file completion
const fileCompletionSchema = z.object({
  fileKey: z.string().min(1, "File key is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  fileType: z.string().min(1, "File type is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Interface for route params
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/projects/[id]/files - List project files
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database to get their internal ID
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to this project
    let project;
    try {
      project = await ProjectService.getProject(projectId, user.id);
    } catch (error) {
      console.error("Error accessing project:", error);
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      100
    );
    const search = url.searchParams.get("search") || undefined;
    const fileType = url.searchParams.get("type") || undefined;

    // Build where clause for filtering
    const whereClause: {
      projectId: string;
      OR?: Array<
        | { originalName: { contains: string; mode: "insensitive" } }
        | { filename: { contains: string; mode: "insensitive" } }
      >;
      mimeType?: { startsWith: string };
    } = {
      projectId,
    };

    if (search) {
      whereClause.OR = [
        { originalName: { contains: search, mode: "insensitive" } },
        { filename: { contains: search, mode: "insensitive" } },
      ];
    }

    if (fileType) {
      whereClause.mimeType = { startsWith: fileType };
    }

    // Get files with pagination
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where: whereClause }),
    ]);

    // Generate download URLs for files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        let downloadUrl = null;
        try {
          downloadUrl = await S3Service.generatePresignedDownloadUrl(
            file.s3Key
          );
        } catch (error) {
          console.error(
            `Failed to generate download URL for file ${file.id}:`,
            error
          );
        }

        return {
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          category: FileTypeUtils.getFileCategory(file.mimeType),
          isPublic: file.isPublic,
          downloadUrl,
          metadata: file.metadata,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          uploadedBy: {
            id: file.uploadedBy.id,
            displayName: file.uploadedBy.displayName,
            username: file.uploadedBy.username,
            avatar: file.uploadedBy.avatar,
          },
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        files: filesWithUrls,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
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

// POST /api/projects/[id]/files - Complete file upload (save to database)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database to get their internal ID
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to this project and can upload files
    let project;
    try {
      project = await ProjectService.getProject(projectId, user.id);
    } catch (error) {
      console.error("Error accessing project:", error);
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user's role in this project to check upload permissions
    const userMembership = project.members.find(
      (member) => member.userId === user.id
    );
    const userRole = userMembership?.role || "MEMBER";

    // Check if user can upload files (VIEWER role cannot upload)
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Insufficient permissions to upload files" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = fileCompletionSchema.parse(body);

    // Verify the file exists in S3
    const fileExists = await S3Service.fileExists(validatedData.fileKey);
    if (!fileExists) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    // Extract file info
    const fileInfo = S3Service.extractFileInfo(
      validatedData.fileName,
      validatedData.fileSize,
      validatedData.fileType
    );

    // Determine S3 bucket and URL
    const s3Bucket = process.env.AWS_S3_BUCKET_NAME || "bona-uploads";
    const s3Url = S3Service.getPublicUrl(validatedData.fileKey);

    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.fileType,
        s3Key: validatedData.fileKey,
        s3Bucket,
        s3Url,
        metadata: validatedData.metadata || {},
        isPublic: false, // Default to private
        projectId,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Generate download URL
    let downloadUrl = null;
    try {
      downloadUrl = await S3Service.generatePresignedDownloadUrl(file.s3Key);
    } catch (error) {
      console.error(
        `Failed to generate download URL for new file ${file.id}:`,
        error
      );
    }

    // Return created file with metadata
    return NextResponse.json({
      success: true,
      data: {
        file: {
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          category: FileTypeUtils.getFileCategory(file.mimeType),
          isPublic: file.isPublic,
          downloadUrl,
          metadata: file.metadata,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          uploadedBy: {
            id: file.uploadedBy.id,
            displayName: file.uploadedBy.displayName,
            username: file.uploadedBy.username,
            avatar: file.uploadedBy.avatar,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error completing file upload:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete file upload" },
      { status: 500 }
    );
  }
}
