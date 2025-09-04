import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/user.model";
import connectMongoDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectMongoDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}


