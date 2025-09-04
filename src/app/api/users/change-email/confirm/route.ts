import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { User } from "@/lib/models/user.model";
import { OtpService } from "@/lib/services/otp.service";
import connectMongoDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newEmail, code, currentPassword } = await req.json();
    if (!newEmail || !code || !currentPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Optional: verify current password if set
    if (user.password) {
      const bcrypt = await import("bcryptjs");
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok)
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
    }

    const verified = await OtpService.verifyOtp(newEmail, "change_email", code);
    if (!verified)
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );

    user.email = newEmail.toLowerCase();
    user.emailVerified = new Date();
    await user.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Confirm email change error:", e);
    return NextResponse.json(
      { error: "Failed to confirm email change" },
      { status: 500 }
    );
  }
}
