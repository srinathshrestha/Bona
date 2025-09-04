import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { ProjectService, UserService } from "@/lib/database";
import { IProject } from "@/lib/models/project.model";

// GET /api/projects/[id] - Get specific project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserById(userId);
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
        owner: projectData.owner,
        memberCount: projectData._count?.members || 0,
        fileCount: projectData._count?.files || 0,
        messageCount: projectData._count?.messages || 0,
        members: projectData.members || [],
        files: projectData.files || [],
        settings: projectData.settings,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the project
    const updatedProject = await ProjectService.updateProject(
      projectId,
      user._id.toString(),
      body
    );

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("Error updating project:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "You don't have permission to update this project" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the project
    await ProjectService.deleteProject(projectId, user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting project:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "You don't have permission to delete this project" },
        { status: 403 }
      );
    }

    if (error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}