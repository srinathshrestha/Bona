import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { User } from "@/lib/models/user.model";
import bcrypt from "bcryptjs";
import { z } from "zod";
import connectMongoDB from "@/lib/mongodb";

// Validation schema for setting password
const SetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SetPasswordSchema.parse(body);

    // Connect to database
    await connectMongoDB();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { error: "Password already set for this account" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update user with password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Password set successfully. You can now sign in with email and password.",
    });
  } catch (error) {
    console.error("Set password error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set password. Please try again.",
      },
      { status: 500 }
    );
  }
}
