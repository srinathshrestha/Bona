import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { User } from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";
import { emailService } from "@/lib/services/email.service";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json(
        { error: "New email is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if new email is already in use
    const existingUser = await User.findByEmail(newEmail);
    if (existingUser && existingUser._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    // Find current user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate email change token
    const emailChangeToken = crypto.randomBytes(32).toString("hex");

    // Store pending email change (you might want to add these fields to the user model)
    user.pendingEmail = newEmail;
    user.emailChangeToken = emailChangeToken;
    user.emailChangeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send confirmation email to new email address
    await emailService.sendEmailChangeConfirmation(newEmail, emailChangeToken);

    return NextResponse.json(
      { message: "Confirmation email sent to new email address" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email change request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
