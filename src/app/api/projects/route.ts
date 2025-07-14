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
  isPrivate: z.boolean().optional().default(true),
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

    // Create the project
    const project = await ProjectService.createProject(user.id, {
      name: validatedData.name,
      description: validatedData.description,
      settings: {
        isPrivate: validatedData.isPrivate,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        isPrivate: validatedData.isPrivate,
        createdAt: project.createdAt,
        owner: {
          id: project.owner.id,
          displayName: project.owner.displayName,
          username: project.owner.username,
          avatar: project.owner.avatar,
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
    const userProjects = await ProjectService.getUserProjects(user.id);

    if (!userProjects) {
      return NextResponse.json({ projects: [] });
    }

    // Format the response
    const ownedProjects = userProjects.ownedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role: "OWNER",
      memberCount: project._count.members,
      fileCount: project._count.files,
      messageCount: project._count.messages,
    }));

    const memberProjects = userProjects.projectMembers.map((membership) => ({
      id: membership.project.id,
      name: membership.project.name,
      description: membership.project.description,
      createdAt: membership.project.createdAt,
      updatedAt: membership.project.updatedAt,
      role: membership.role,
      memberCount: membership.project._count.members,
      fileCount: membership.project._count.files,
      messageCount: membership.project._count.messages,
      owner: {
        id: membership.project.owner.id,
        displayName: membership.project.owner.displayName,
        username: membership.project.owner.username,
        avatar: membership.project.owner.avatar,
      },
    }));

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
