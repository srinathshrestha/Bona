import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { z } from "zod";

// Validation schema for registration
const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),
  displayName: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();

    // Validate input
    const validatedData = RegisterSchema.parse(body);

    // Register the user
    const user = await AuthService.registerUser({
      email: validatedData.email,
      password: validatedData.password,
      username: validatedData.username,
      displayName: validatedData.displayName,
    });

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please sign in.",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

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
      if (
        error.message.includes("already exists") ||
        error.message.includes("already taken")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        ); // Conflict
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register user. Please try again.",
      },
      { status: 500 }
    );
  }
}
