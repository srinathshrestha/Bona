import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { UserService } from "@/lib/database";

// GET /api/users/sync - Get current user data (for compatibility)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserById(currentUser.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get user with projects for additional data
    const userWithProjects = await UserService.getUserWithProjects(
      user._id.toString()
    );

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        settings: user.settings,
        createdAt: user.createdAt,
        // Include project counts
        ownedProjectsCount: userWithProjects?.ownedProjects.length || 0,
        memberProjectsCount: userWithProjects?.memberProjects.length || 0,
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

// POST /api/users/sync - No longer needed for NextAuth, but kept for compatibility
export async function POST() {
  // With NextAuth, user sync happens automatically during sign-in
  // This endpoint can be kept for backward compatibility but just returns current user
  return GET();
}
