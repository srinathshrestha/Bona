import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database to get their internal ID
    const user = await UserService.getUserByClerkId(userId);
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
          id: user.id,
          displayName: user.displayName,
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database to get their internal ID
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's projects (both owned and member)
    const userProjects = await ProjectService.getUserProjects(
      user._id.toString()
    );

    if (!userProjects) {
      return NextResponse.json({ projects: [] });
    }

    // Format the response
    const ownedProjects = (userProjects.ownedProjects || []).map((project) => ({
      id: project.id || project._id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role: "OWNER",
      memberCount: 0, // We'll need to get this count separately
      fileCount: 0, // We'll need to get this count separately
      messageCount: 0, // We'll need to get this count separately
    }));

    const memberProjects = (userProjects.memberProjects || []).map(
      (project) => ({
        id: project.id || project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        role: project.membershipRole,
        memberCount: 0, // We'll need to get this count separately
        fileCount: 0, // We'll need to get this count separately
        messageCount: 0, // We'll need to get this count separately
        owner: {
          id: project.ownerId,
          displayName: project.owner?.displayName || "Unknown",
          username: project.owner?.username || "unknown",
          avatar: project.owner?.avatar || "",
        },
      })
    );

    return NextResponse.json({
      projects: {
        owned: ownedProjects,
        member: memberProjects,
        total: ownedProjects.length + memberProjects.length,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
