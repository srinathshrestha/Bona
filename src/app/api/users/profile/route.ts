import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/database";
import { z } from "zod";
// Removed Prisma import - using native types

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  isOnboarded: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Check if username is available (if provided)
    if (validatedData.username) {
      const isAvailable = await UserService.isUsernameAvailable(
        validatedData.username,
        userId
      );

      if (!isAvailable) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await UserService.updateUserProfile(userId, {
      ...validatedData,
      settings: validatedData.settings, // Removed Prisma cast since we're using MongoDB
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        isOnboarded: updatedUser.isOnboarded,
        settings: updatedUser.settings,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// GET /api/users/profile - Get current user profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await UserService.getUserByClerkId(userId);

    // If user doesn't exist in database, sync them from Clerk
    if (!user) {
      console.log(`👤 Auto-syncing new user from Clerk: ${userId}`);
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return NextResponse.json({ error: "Unable to fetch user from Clerk" }, { status: 500 });
      }

      // Sync user from Clerk to database
      user = await UserService.syncUserFromClerk(clerkUser);
      console.log(`✅ Successfully synced user: ${user.email}`);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
