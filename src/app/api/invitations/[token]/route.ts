import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { InvitationService, UserService } from "@/lib/database";

// GET /api/invitations/[token] - Validate invitation token and get project info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate invitation token
    const inviteLink = await InvitationService.validateInvitationToken(token);

    // Return project information for preview
    return NextResponse.json({
      valid: true,
      project: {
        id: inviteLink.project.id,
        name: inviteLink.project.name,
        description: inviteLink.project.description,
        owner: inviteLink.project.owner,
        stats: inviteLink.project._count,
      },
      inviteLink: {
        id: inviteLink.id,
        maxUses: inviteLink.maxUses,
        currentUses: inviteLink.currentUses,
        expiresAt: inviteLink.expiresAt,
        createdAt: inviteLink.createdAt,
      },
    });
  } catch (error) {
    console.error("Error validating invitation token:", error);

    // Handle specific validation errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          valid: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: "Invalid invitation token",
      },
      { status: 400 }
    );
  }
}

// POST /api/invitations/[token] - Accept invitation and join project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // Get the user from database, or sync from Clerk if new user
    let user = await UserService.getUserByClerkId(userId);

    if (!user) {
      // User doesn't exist in our database yet - sync from Clerk
      console.log(`New user joining via invitation: ${userId}`);
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return NextResponse.json(
          { error: "Unable to retrieve user information" },
          { status: 500 }
        );
      }

      // Sync user from Clerk to our database
      const syncedUser = await UserService.syncUserFromClerk({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });

      // Now get the user with proper includes for invitation acceptance
      user = await UserService.getUserByClerkId(syncedUser.clerkId);

      if (!user) {
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }
    }

    // Get request information for logging
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Accept invitation
    const member = await InvitationService.acceptInvitation(token, user.id, {
      ipAddress,
      userAgent,
    });

    // Return different status codes for existing vs new members
    const statusCode = member.isExistingMember ? 200 : 201;

    return NextResponse.json(
      {
        success: true,
        isExistingMember: member.isExistingMember,
        member: {
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            id: member.user.id,
            displayName: member.user.displayName,
            username: member.user.username,
            avatar: member.user.avatar,
          },
          project: {
            id: member.project.id,
            name: member.project.name,
            description: member.project.description,
          },
        },
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("already a member")) {
        return NextResponse.json(
          { error: "You are already a member of this project" },
          { status: 409 }
        );
      }

      if (
        error.message.includes("Invalid invitation token") ||
        error.message.includes("deactivated") ||
        error.message.includes("expired") ||
        error.message.includes("usage limit")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
