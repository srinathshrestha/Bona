import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";
import { emailService } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Check if username is taken (if provided)
    if (username) {
      const usernameExists = await User.findByUsername(username);
      if (usernameExists) {
        return NextResponse.json(
          {
            error: "This username is already taken. Please choose another one.",
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      username,
      displayName,
      emailVerificationToken,
      isOnboarded: false,
    });

    await user.save();
    console.log(`User ${email} saved successfully`);

    // Try to send verification email, but don't fail if it doesn't work
    try {
      await emailService.sendVerificationEmail(email, emailVerificationToken);

      return NextResponse.json(
        {
          message:
            "Account created successfully! Please check your email to verify your account before signing in.",
          userId: user._id,
          emailSent: true,
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      // Mark user as verified since email verification failed
      await User.findByIdAndUpdate(user._id, {
        emailVerified: new Date(),
        emailVerificationToken: null,
      });

      return NextResponse.json(
        {
          message:
            "Account created successfully! You can now sign in. (Email verification temporarily unavailable)",
          userId: user._id,
          emailSent: false,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while creating your account. Please try again.",
      },
      { status: 500 }
    );
  }
}
