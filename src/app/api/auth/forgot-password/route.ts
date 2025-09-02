import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";
import { emailService } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongoDB();

    // Find user with this email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json(
        {
          message:
            "If a user with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token and expiry
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    return NextResponse.json(
      {
        message:
          "If a user with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
