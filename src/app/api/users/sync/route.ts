import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UserService } from "@/lib/database";

// POST /api/users/sync - Sync current user from Clerk to database
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sync user to database
    const user = await UserService.syncUserFromClerk(clerkUser);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user data" },
      { status: 500 }
    );
  }
}

// GET /api/users/sync - Get current user data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        settings: user.settings,
        createdAt: user.createdAt,
        // Include project counts
        ownedProjectsCount: user.ownedProjects.length,
        memberProjectsCount: user.projectMembers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
