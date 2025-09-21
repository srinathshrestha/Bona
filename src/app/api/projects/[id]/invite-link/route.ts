import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { InvitationService, UserService } from "@/lib/database";
import { getInvitationUrl } from "@/lib/utils/url";

// GET /api/projects/[id]/invite-link - Get active invitation link
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

    // Get active invitation link
    const inviteLink = await InvitationService.getActiveInvitationLink(
      projectId
    );

    if (!inviteLink) {
      return NextResponse.json(
        {
          message: "No active invitation link found",
        },
        { status: 404 }
      );
    }

    // Return invitation link data
    return NextResponse.json({
      id: inviteLink.id,
      secretToken: inviteLink.secretToken,
      isActive: inviteLink.isActive,
      maxUses: inviteLink.maxUses,
      currentUses: inviteLink.currentUses,
      expiresAt: inviteLink.expiresAt,
      createdAt: inviteLink.createdAt,
      createdById: inviteLink.createdById,
      projectId: inviteLink.projectId,
      role: inviteLink.role,
      url: getInvitationUrl(inviteLink.secretToken),
    });
  } catch (error) {
    console.error("Error fetching invitation link:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation link" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/invite-link - Create or regenerate invitation link
export async function POST(
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

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const options: {
      maxUses?: number;
      expiresAt?: string;
      role?: "MEMBER" | "VIEWER";
    } = body;

    // Convert expiration date if provided
    const expiresAt = options.expiresAt
      ? new Date(options.expiresAt)
      : undefined;

    // Create invitation link - use explicit _id.toString()
    const inviteLink = await InvitationService.createInvitationLink(
      projectId,
      user._id.toString(),
      {
        maxUses: options.maxUses,
        expiresAt,
        role: options.role,
      }
    );

    // Return created invitation link
    return NextResponse.json(
      {
        id: inviteLink.id,
        secretToken: inviteLink.secretToken,
        isActive: inviteLink.isActive,
        maxUses: inviteLink.maxUses,
        currentUses: inviteLink.currentUses,
        expiresAt: inviteLink.expiresAt,
        createdAt: inviteLink.createdAt,
        createdById: inviteLink.createdById,
        projectId: inviteLink.projectId,
        role: inviteLink.role,
        url: getInvitationUrl(inviteLink.secretToken),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invitation link:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Only project owners")) {
        return NextResponse.json(
          { error: "Only project owners can create invitation links" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create invitation link" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/invite-link - Deactivate invitation link
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

    // Deactivate invitation link
    await InvitationService.deactivateInvitationLink(
      projectId,
      user._id.toString()
    );

    return NextResponse.json({
      message: "Invitation link deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating invitation link:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Only project owners")) {
        return NextResponse.json(
          { error: "Only project owners can deactivate invitation links" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to deactivate invitation link" },
      { status: 500 }
    );
  }
}
