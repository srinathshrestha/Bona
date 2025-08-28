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

    // Get counts for each project
    const getProjectWithCounts = async (
      project: Record<string, unknown>,
      role: string,
      owner?: Record<string, unknown>
    ) => {
      try {
        const stats = await ProjectService.getProjectStats(
          (project.id as string) || (project._id as string)
        );
        return {
          id: project.id || project._id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          role,
          memberCount: stats.memberCount,
          fileCount: stats.fileCount,
          messageCount: stats.messageCount,
          ...(owner && { owner }),
        };
      } catch (error) {
        console.error(`Error getting stats for project ${project.id}:`, error);
        return {
          id: project.id || project._id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          role,
          memberCount: 0,
          fileCount: 0,
          messageCount: 0,
          ...(owner && { owner }),
        };
      }
    };

    // Format the response with actual counts
    const ownedProjects = await Promise.all(
      (userProjects.ownedProjects || []).map((project) =>
        getProjectWithCounts(project.toObject(), "OWNER")
      )
    );

    const memberProjects = await Promise.all(
      (userProjects.memberProjects || []).map((project) =>
        getProjectWithCounts(project, project.membershipRole, {
          id: project.ownerId,
          displayName: project.owner?.displayName || "Unknown",
          username: project.owner?.username || "unknown",
          avatar: project.owner?.avatar || "",
        })
      )
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
