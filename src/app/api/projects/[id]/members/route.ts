import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  PermissionService, 
  UserService, 
  ProjectService
} from "@/lib/database";
import { ProjectRole } from "@/lib/database";

// GET /api/projects/[id]/members - Get project members
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

    // Check if user has access to view members (any member can view)
    const hasAccess = await PermissionService.checkPermission(
      projectId,
      user.id,
      ProjectRole.VIEWER
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Get project with members
    const project = await ProjectService.getProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user's role for response context
    const userRole = await PermissionService.getUserRole(projectId, user.id);

    // Return members with appropriate detail level based on user role
    const members = project.members.map(member => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      updatedAt: member.updatedAt,
      user: {
        id: member.user.id,
        displayName: member.user.displayName,
        username: member.user.username,
        email: member.user.email,
        avatar: member.user.avatar,
      },
    }));

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
    if (!Object.values(ProjectRole).includes(newRole)) {
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
        user: {
          id: updatedMember.user.id,
          displayName: updatedMember.user.displayName,
          username: updatedMember.user.username,
          email: updatedMember.user.email,
          avatar: updatedMember.user.avatar,
        },
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
        user: {
          id: removedMember.user.id,
          displayName: removedMember.user.displayName,
          username: removedMember.user.username,
          email: removedMember.user.email,
        },
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