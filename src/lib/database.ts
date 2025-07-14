import { prisma } from "./prisma";
import {
  ProjectRole,
  Prisma,
  JoinMethod,
  FileAccessType,
  User,
} from "@prisma/client";
import { headers } from "next/headers";
import crypto from "crypto";

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

    // Generate displayName from Clerk data if not already set
    const displayName =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || undefined;

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        avatar: clerkUser.imageUrl,
        // Only update displayName if it's not already set
        ...(displayName && { displayName }),
      },
      create: {
        clerkId: clerkUser.id,
        email,
        displayName,
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
      settings?: Prisma.InputJsonValue;
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
      settings?: Prisma.InputJsonValue;
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
      settings?: Prisma.InputJsonValue;
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

// === NEW SERVICES FOR ENHANCED INVITATION & PERMISSION SYSTEM ===

// Invitation service for secret link management
export class InvitationService {
  // Generate cryptographically secure token
  static generateSecretToken(): string {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString(36);
    return `${timestamp}-${randomBytes.toString("base64url")}`;
  }

  // Create or regenerate invitation link
  static async createInvitationLink(
    projectId: string,
    createdById: string,
    options: {
      maxUses?: number;
      expiresAt?: Date;
    } = {}
  ) {
    // Check if user has permission to create invite links (OWNER only)
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: createdById,
        },
      },
    });

    if (!member || member.role !== ProjectRole.OWNER) {
      throw new Error("Only project owners can create invitation links");
    }

    // Deactivate existing active link
    await prisma.projectInviteLink.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false },
    });

    // Create new invitation link
    const secretToken = this.generateSecretToken();

    return prisma.projectInviteLink.create({
      data: {
        projectId,
        createdById,
        secretToken,
        maxUses: options.maxUses,
        expiresAt: options.expiresAt,
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    });
  }

  // Get active invitation link for project
  static async getActiveInvitationLink(projectId: string) {
    return prisma.projectInviteLink.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    });
  }

  // Validate invitation token and get project info
  static async validateInvitationToken(token: string) {
    const inviteLink = await prisma.projectInviteLink.findUnique({
      where: { secretToken: token },
      include: {
        project: {
          include: {
            owner: {
              select: {
                displayName: true,
                username: true,
                avatar: true,
              },
            },
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
    });

    if (!inviteLink) {
      throw new Error("Invalid invitation token");
    }

    if (!inviteLink.isActive) {
      throw new Error("Invitation link has been deactivated");
    }

    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      throw new Error("Invitation link has expired");
    }

    if (inviteLink.maxUses && inviteLink.currentUses >= inviteLink.maxUses) {
      throw new Error("Invitation link has reached its usage limit");
    }

    return inviteLink;
  }

  // Process invitation acceptance
  static async acceptInvitation(
    token: string,
    userId: string,
    requestInfo: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ) {
    const inviteLink = await this.validateInvitationToken(token);

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: inviteLink.projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new Error("User is already a member of this project");
    }

    // Use transaction to add member and log join
    const result = await prisma.$transaction(async (tx) => {
      // Add user as member
      const member = await tx.projectMember.create({
        data: {
          projectId: inviteLink.projectId,
          userId,
          role: ProjectRole.MEMBER, // Default role for all invitations
        },
        include: {
          user: true,
          project: true,
        },
      });

      // Log the join
      await tx.memberJoinLog.create({
        data: {
          userId,
          projectId: inviteLink.projectId,
          joinMethod: JoinMethod.INVITE_LINK,
          inviteToken: token,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        },
      });

      // Update usage count
      await tx.projectInviteLink.update({
        where: { id: inviteLink.id },
        data: { currentUses: { increment: 1 } },
      });

      return member;
    });

    return result;
  }

  // Deactivate invitation link
  static async deactivateInvitationLink(projectId: string, userId: string) {
    // Check permissions
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member || member.role !== ProjectRole.OWNER) {
      throw new Error("Only project owners can deactivate invitation links");
    }

    return prisma.projectInviteLink.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false },
    });
  }

  // Get invitation link statistics
  static async getInvitationStats(projectId: string) {
    return prisma.projectInviteLink.findMany({
      where: { projectId },
      include: {
        joinLogs: {
          include: {
            user: {
              select: {
                displayName: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        createdBy: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

// Permission service for role-based access control
export class PermissionService {
  // Check if user has specific permission
  static async checkPermission(
    projectId: string,
    userId: string,
    requiredRole: ProjectRole
  ): Promise<boolean> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) return false;

    // Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER
    const roleHierarchy = {
      [ProjectRole.OWNER]: 4,
      [ProjectRole.ADMIN]: 3,
      [ProjectRole.MEMBER]: 2,
      [ProjectRole.VIEWER]: 1,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }

  // Get user's role in project
  static async getUserRole(
    projectId: string,
    userId: string
  ): Promise<ProjectRole | null> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: { role: true },
    });

    return member?.role || null;
  }

  // Change user role (with permission checking and logging)
  static async changeUserRole(
    projectId: string,
    targetUserId: string,
    newRole: ProjectRole,
    changedById: string,
    reason?: string
  ) {
    // Get current member info
    const targetMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new Error("User is not a member of this project");
    }

    // Check if changer has permission
    const changerRole = await this.getUserRole(projectId, changedById);
    if (!changerRole) {
      throw new Error("You are not a member of this project");
    }

    // Role change permission matrix
    const canChangeRole = (
      changerRole: ProjectRole,
      targetRole: ProjectRole,
      newRole: ProjectRole
    ) => {
      if (changerRole === ProjectRole.OWNER) return true; // Owner can change any role
      if (changerRole === ProjectRole.ADMIN) {
        // Admin can only change MEMBER and VIEWER roles
        return (
          (targetRole === ProjectRole.MEMBER ||
            targetRole === ProjectRole.VIEWER) &&
          (newRole === ProjectRole.MEMBER || newRole === ProjectRole.VIEWER)
        );
      }
      return false; // MEMBER and VIEWER cannot change roles
    };

    if (!canChangeRole(changerRole, targetMember.role, newRole)) {
      throw new Error("Insufficient permissions to change this user's role");
    }

    // Use transaction to update role and log change
    const result = await prisma.$transaction(async (tx) => {
      // Update member role
      const updatedMember = await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
        data: { role: newRole },
        include: {
          user: true,
          project: true,
        },
      });

      // Log the role change
      await tx.roleChangeLog.create({
        data: {
          userId: targetUserId,
          projectId,
          changedById,
          oldRole: targetMember.role,
          newRole,
          reason,
        },
      });

      return updatedMember;
    });

    return result;
  }

  // Remove member from project (with permission checking and logging)
  static async removeMember(
    projectId: string,
    targetUserId: string,
    removedById: string,
    reason?: string
  ) {
    // Get current member info
    const targetMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new Error("User is not a member of this project");
    }

    // Check if remover has permission
    const removerRole = await this.getUserRole(projectId, removedById);
    if (!removerRole) {
      throw new Error("You are not a member of this project");
    }

    // Member removal permission matrix
    const canRemoveMember = (
      removerRole: ProjectRole,
      targetRole: ProjectRole
    ) => {
      if (removerRole === ProjectRole.OWNER) return true; // Owner can remove anyone
      if (removerRole === ProjectRole.ADMIN) {
        // Admin can only remove MEMBER and VIEWER roles
        return (
          targetRole === ProjectRole.MEMBER || targetRole === ProjectRole.VIEWER
        );
      }
      return false; // MEMBER and VIEWER cannot remove members
    };

    if (!canRemoveMember(removerRole, targetMember.role)) {
      throw new Error("Insufficient permissions to remove this user");
    }

    // Cannot remove project owner
    if (targetMember.role === ProjectRole.OWNER) {
      throw new Error("Cannot remove project owner");
    }

    // Use transaction to remove member and log removal
    const result = await prisma.$transaction(async (tx) => {
      // Remove member
      const removedMember = await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
        include: {
          user: true,
          project: true,
        },
      });

      // Log the removal as a role change to "REMOVED"
      await tx.roleChangeLog.create({
        data: {
          userId: targetUserId,
          projectId,
          changedById: removedById,
          oldRole: targetMember.role,
          newRole: ProjectRole.VIEWER, // Use VIEWER as placeholder for removed
          reason: reason || "Member removed from project",
        },
      });

      return removedMember;
    });

    return result;
  }

  // Get permission summary for user
  static async getPermissionSummary(projectId: string, userId: string) {
    const role = await this.getUserRole(projectId, userId);

    if (!role) {
      return {
        role: null,
        permissions: {
          canView: false,
          canUpload: false,
          canDownload: false,
          canDelete: false,
          canChat: false,
          canInvite: false,
          canManageMembers: false,
          canManageProject: false,
        },
      };
    }

    // Define permissions based on role
    const permissions = {
      canView: true, // All members can view
      canUpload: role !== ProjectRole.VIEWER,
      canDownload: role !== ProjectRole.VIEWER,
      canDelete: role === ProjectRole.OWNER || role === ProjectRole.ADMIN,
      canChat: role !== ProjectRole.VIEWER,
      canInvite: role === ProjectRole.OWNER,
      canManageMembers:
        role === ProjectRole.OWNER || role === ProjectRole.ADMIN,
      canManageProject:
        role === ProjectRole.OWNER || role === ProjectRole.ADMIN,
    };

    return { role, permissions };
  }
}

// File access service for logging and permission checking
export class FileAccessService {
  // Helper to get request information
  static getRequestInfo() {
    try {
      const headersList = headers();
      return {
        ipAddress:
          headersList.get("x-forwarded-for") ||
          headersList.get("x-real-ip") ||
          "unknown",
        userAgent: headersList.get("user-agent") || "unknown",
      };
    } catch {
      return { ipAddress: "unknown", userAgent: "unknown" };
    }
  }

  // Log file access
  static async logFileAccess(
    fileId: string,
    userId: string,
    accessType: FileAccessType,
    requestInfo?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const info = requestInfo || this.getRequestInfo();

    return prisma.fileAccess.create({
      data: {
        fileId,
        userId,
        accessType,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
      },
    });
  }

  // Check if user can access file
  static async checkFileAccess(
    fileId: string,
    userId: string,
    accessType: FileAccessType
  ): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!file) return false;

    const member = file.project.members[0];
    if (!member) return false;

    // Check permission based on access type and role
    switch (accessType) {
      case FileAccessType.VIEW:
        return true; // All members can view
      case FileAccessType.DOWNLOAD:
        return member.role !== ProjectRole.VIEWER;
      case FileAccessType.UPLOAD:
        return member.role !== ProjectRole.VIEWER;
      case FileAccessType.DELETE:
        return (
          member.role === ProjectRole.OWNER || member.role === ProjectRole.ADMIN
        );
      default:
        return false;
    }
  }

  // Get file access logs
  static async getFileAccessLogs(
    fileId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    return prisma.fileAccess.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  // Get user's file access history
  static async getUserFileAccesses(
    userId: string,
    options: {
      projectId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { userId };

    if (options.projectId) {
      where.file = {
        projectId: options.projectId,
      };
    }

    return prisma.fileAccess.findMany({
      where,
      include: {
        file: {
          select: {
            originalName: true,
            mimeType: true,
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }
}

// Audit service for tracking system activities
export class AuditService {
  // Get member join history
  static async getMemberJoinHistory(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    return prisma.memberJoinLog.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            displayName: true,
            username: true,
            avatar: true,
          },
        },
        inviteLink: {
          select: {
            secretToken: true,
            createdBy: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  // Get role change history
  static async getRoleChangeHistory(
    projectId: string,
    options: {
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { projectId };

    if (options.userId) {
      where.userId = options.userId;
    }

    return prisma.roleChangeLog.findMany({
      where,
      include: {
        user: {
          select: {
            displayName: true,
            username: true,
            avatar: true,
          },
        },
        changedBy: {
          select: {
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { changedAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  // Get comprehensive audit trail
  static async getAuditTrail(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const [joinLogs, roleChanges] = await Promise.all([
      this.getMemberJoinHistory(projectId, options),
      this.getRoleChangeHistory(projectId, options),
    ]);

    // Combine and sort by timestamp
    const combined = [
      ...joinLogs.map((log) => ({
        type: "join" as const,
        timestamp: log.joinedAt,
        data: log,
      })),
      ...roleChanges.map((log) => ({
        type: "role_change" as const,
        timestamp: log.changedAt,
        data: log,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return combined.slice(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 50)
    );
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

// Helper function for checking route permissions in pages/API routes
export class RoutePermissionService {
  // Check if user has access to a project with minimum required role
  static async checkProjectAccess(
    userId: string, // Clerk user ID
    projectId: string,
    minimumRole: ProjectRole = ProjectRole.VIEWER
  ): Promise<{ hasAccess: boolean; user?: User; userRole?: ProjectRole }> {
    try {
      // Get user from database
      const user = await UserService.getUserByClerkId(userId);
      if (!user) {
        return { hasAccess: false };
      }

      // Check if user has required permission
      const hasPermission = await PermissionService.checkPermission(
        projectId,
        user.id,
        minimumRole
      );

      if (!hasPermission) {
        return { hasAccess: false, user };
      }

      // Get user's actual role in project
      const membership = await prisma.projectMember.findFirst({
        where: {
          userId: user.id,
          projectId: projectId,
        },
      });

      return {
        hasAccess: true,
        user,
        userRole: membership?.role as ProjectRole,
      };
    } catch (error) {
      console.error("Route permission check error:", error);
      return { hasAccess: false };
    }
  }

  // Check if user can create projects (basic auth check)
  static async checkCreateProjectAccess(
    userId: string
  ): Promise<{ hasAccess: boolean; user?: User }> {
    try {
      const user = await UserService.getUserByClerkId(userId);
      return { hasAccess: !!user, user };
    } catch (error) {
      console.error("Create project permission check error:", error);
      return { hasAccess: false };
    }
  }
}
