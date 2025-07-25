import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { InvitationService, UserService } from "@/lib/database";

// GET /api/projects/[id]/invite-link - Get active invitation link
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
      createdBy: inviteLink.createdBy,
      project: inviteLink.project,
      url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/join/${inviteLink.secretToken}`,
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

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const options: {
      maxUses?: number;
      expiresAt?: string;
    } = body;

    // Convert expiration date if provided
    const expiresAt = options.expiresAt
      ? new Date(options.expiresAt)
      : undefined;

    // Create invitation link
    const inviteLink = await InvitationService.createInvitationLink(
      projectId,
      user.id,
      {
        maxUses: options.maxUses,
        expiresAt,
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
        createdBy: inviteLink.createdBy,
        project: inviteLink.project,
        url: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/join/${inviteLink.secretToken}`,
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

    // Deactivate invitation link
    await InvitationService.deactivateInvitationLink(projectId, user.id);

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
