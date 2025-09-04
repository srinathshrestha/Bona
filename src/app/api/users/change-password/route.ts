import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUserId } from "@/lib/auth";
import { User } from "@/lib/models/user.model";
import connectMongoDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword, confirmPassword } = await req.json();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const user = await User.findById(userId);
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Password change not available for this account" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Change password error:", e);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
