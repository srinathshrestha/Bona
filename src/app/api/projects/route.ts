import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { ProjectService, UserService } from "@/lib/database";
import { z } from "zod";

// Validation schema for project creation
const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = projectCreateSchema.parse(body);

    // Create the project (all projects are private by default)
    const result = await ProjectService.createProject(user._id.toString(), {
      name: validatedData.name,
      description: validatedData.description,
      settings: {
        isPrivate: true, // All projects are private
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: result.project.id || result.project._id,
        name: result.project.name,
        description: result.project.description,
        isPrivate: true, // Always private
        createdAt: result.project.createdAt,
        owner: {
          id: user._id.toString(),
          username: user.username,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// GET /api/projects - Get user's projects
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's projects
    const userProjects = await ProjectService.getUserProjects(
      user._id.toString()
    );

    // Combine owned and member projects
    const allProjects = [
      ...userProjects.ownedProjects.map((project) => ({
        ...project.toObject(),
        role: "OWNER",
        isOwner: true,
      })),
      ...userProjects.memberProjects.map((memberProject) => ({
        ...memberProject.project,
        role: memberProject.role,
        isOwner: false,
        joinedAt: memberProject.joinedAt,
      })),
    ];

    // Format the response
    const formattedProjects = allProjects.map((project) => ({
      id: project._id,
      name: project.name,
      description: project.description,
      isPrivate: project.isPrivate || true,
      memberCount: project.memberCount || 1,
      fileCount: project.fileCount || 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role: project.role,
      isOwner: project.isOwner,
      owner: project.isOwner
        ? {
            id: user._id.toString(),
            username: user.username,
            avatar: user.avatar,
          }
        : {
            id: project.ownerId || user._id.toString(),
            username: project.owner?.username || user.username,
            avatar: project.owner?.avatar || user.avatar,
          },
    }));

    // Separate owned and member projects
    const ownedProjects = formattedProjects.filter(
      (project) => project.isOwner
    );
    const memberProjects = formattedProjects.filter(
      (project) => !project.isOwner
    );

    return NextResponse.json({
      projects: {
        owned: ownedProjects,
        member: memberProjects,
        total: formattedProjects.length,
      },
      count: formattedProjects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete multiple projects
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { projectIds } = body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "Project IDs are required" },
        { status: 400 }
      );
    }

    // Delete each project
    const results = await Promise.allSettled(
      projectIds.map((projectId) =>
        ProjectService.deleteProject(projectId, user._id.toString())
      )
    );

    // Check results
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      console.error("Some projects failed to delete:", failed);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${succeeded} project(s)`,
      deleted: succeeded,
      failed: failed.length,
    });
  } catch (error) {
    console.error("Error deleting projects:", error);
    return NextResponse.json(
      { error: "Failed to delete projects" },
      { status: 500 }
    );
  }
}
