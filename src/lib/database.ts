import { prisma } from "./prisma";
import { ProjectRole } from "@prisma/client";

// User database operations
export class UserService {
  // Create or update user from Clerk data
  static async syncUserFromClerk(clerkUser: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  }) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error("User must have an email address");
    }

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatar: clerkUser.imageUrl,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatar: clerkUser.imageUrl,
      },
    });

    return user;
  }

  // Get user by Clerk ID
  static async getUserByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
      include: {
        ownedProjects: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        projectMembers: {
          include: {
            project: {
              include: {
                owner: true,
                _count: {
                  select: {
                    members: true,
                    files: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Update user profile
  static async updateUserProfile(
    clerkId: string,
    data: {
      username?: string;
      displayName?: string;
      bio?: string;
      isOnboarded?: boolean;
      settings?: any;
    }
  ) {
    return prisma.user.update({
      where: { clerkId },
      data,
    });
  }

  // Check if username is available
  static async isUsernameAvailable(username: string, excludeClerkId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { clerkId: true },
    });

    return !user || (excludeClerkId && user.clerkId === excludeClerkId);
  }
}

// Project database operations
export class ProjectService {
  // Create a new project
  static async createProject(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      settings?: any;
    }
  ) {
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Add owner as a member with OWNER role
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: ownerId,
        role: ProjectRole.OWNER,
      },
    });

    return project;
  }

  // Get user's projects (owned + member)
  static async getUserProjects(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedProjects: {
          include: {
            _count: {
              select: {
                members: true,
                files: true,
                messages: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        projectMembers: {
          include: {
            project: {
              include: {
                owner: true,
                _count: {
                  select: {
                    members: true,
                    files: true,
                    messages: true,
                  },
                },
              },
            },
          },
          where: {
            role: {
              not: ProjectRole.OWNER,
            },
          },
          orderBy: { joinedAt: "desc" },
        },
      },
    });
  }

  // Get project with members
  static async getProject(projectId: string, userId: string) {
    // First check if user has access to this project
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error("Access denied to this project");
    }

    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
          orderBy: { joinedAt: "asc" },
        },
        files: {
          include: {
            uploadedBy: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limit recent files
        },
        _count: {
          select: {
            members: true,
            files: true,
            messages: true,
          },
        },
      },
    });
  }

  // Add member to project
  static async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole = ProjectRole.MEMBER
  ) {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  // Update project
  static async updateProject(
    projectId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      settings?: any;
    }
  ) {
    // Check if user has admin access
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (
      !member ||
      (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN)
    ) {
      throw new Error("Insufficient permissions to update project");
    }

    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }
}

// General database utilities
export class DatabaseUtils {
  // Health check
  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get database stats
  static async getStats() {
    const [userCount, projectCount, fileCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.file.count(),
    ]);

    return {
      users: userCount,
      projects: projectCount,
      files: fileCount,
      timestamp: new Date().toISOString(),
    };
  }
}
