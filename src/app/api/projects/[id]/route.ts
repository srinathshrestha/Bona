import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ProjectService, UserService } from "@/lib/database";
import { IProject } from "@/lib/models/project.model";

// GET /api/projects/[id] - Get specific project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project details
    const project = await ProjectService.getProject(
      projectId,
      user._id.toString()
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get project details with extended data
    const projectData = project as IProject & {
      members?: unknown[];
      files?: unknown[];
      _count?: { members: number; files: number; messages: number };
    };

    return NextResponse.json({
      project: {
        id: projectData._id,
        name: projectData.name,
        description: projectData.description,
        isPrivate: projectData.isPrivate,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
        ownerId: projectData.ownerId,
        members: projectData.members || [],
        files: projectData.files || [],
        stats: projectData._count || {
          members: 0,
          files: 0,
          messages: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project (OWNER only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the project (this will check if user is owner)
    await ProjectService.deleteProject(projectId, user._id.toString());

    return NextResponse.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Only project owners")) {
        return NextResponse.json(
          { error: "Only project owners can delete projects" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project (OWNER/ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData = {
      name: body.name,
      description: body.description,
      settings: body.settings,
    };

    // Update the project (this will check if user has permission)
    const updatedProject = await ProjectService.updateProject(
      projectId,
      user._id.toString(),
      updateData
    );

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id || updatedProject._id,
        name: updatedProject.name,
        description: updatedProject.description,
        isPrivate: updatedProject.isPrivate,
        updatedAt: updatedProject.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("permission")) {
        return NextResponse.json(
          { error: "You don't have permission to update this project" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
