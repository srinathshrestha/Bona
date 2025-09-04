import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { 
  PermissionService, 
  UserService, 
  ProjectService
} from "@/lib/database";
import { ProjectRole } from "@/lib/models/types";
import { IUser } from "@/lib/models/user.model";

// GET /api/projects/[id]/members - Get project members
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

    // Check if user has access to view members (any member can view)
    const hasAccess = await PermissionService.checkPermission(
      projectId,
      user.id,
      "VIEWER"
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Get project and verify access
    const project = await ProjectService.getProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user's role for response context
    const userRole = await PermissionService.getUserRole(projectId, user.id);

    // Get members with populated user data
    const members = await ProjectService.getProjectMembers(projectId);

    return NextResponse.json({
      members,
      userRole,
      project: {
        id: project.id,
        name: project.name,
        ownerId: project.ownerId,
      },
      permissions: await PermissionService.getPermissionSummary(projectId, user.id),
    });

  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/members - Update member role
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { targetUserId, newRole, reason } = body;

    // Validate input
    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: "Target user ID and new role are required" },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles: ProjectRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(newRole as ProjectRole)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Update member role using service (includes permission checking)
    const updatedMember = await PermissionService.changeUserRole(
      projectId,
      targetUserId,
      newRole,
      user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        updatedAt: updatedMember.updatedAt,
        user: updatedMember.userId ? {
          id: (updatedMember.userId as unknown as IUser).id,
          displayName: (updatedMember.userId as unknown as IUser).displayName,
          username: (updatedMember.userId as unknown as IUser).username,
          email: (updatedMember.userId as unknown as IUser).email,
          avatar: (updatedMember.userId as unknown as IUser).avatar,
        } : null,
      },
      message: `Role updated to ${newRole}`,
    });

  } catch (error) {
    console.error("Error updating member role:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("not a member") || 
          error.message.includes("Insufficient permissions")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members - Remove member from project
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

    // Parse request body
    const body = await request.json();
    const { targetUserId, reason } = body;

    // Validate input
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    // Remove member using service (includes permission checking)
    const removedMember = await PermissionService.removeMember(
      projectId,
      targetUserId,
      user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      removedMember: {
        id: removedMember.id,
        role: removedMember.role,
        user: removedMember.userId ? {
          id: (removedMember.userId as unknown as IUser).id,
          displayName: (removedMember.userId as unknown as IUser).displayName,
          username: (removedMember.userId as unknown as IUser).username,
          email: (removedMember.userId as unknown as IUser).email,
        } : null,
      },
      message: "Member removed successfully",
    });

  } catch (error) {
    console.error("Error removing member:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("not a member") || 
          error.message.includes("Insufficient permissions") ||
          error.message.includes("Cannot remove project owner")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
} 