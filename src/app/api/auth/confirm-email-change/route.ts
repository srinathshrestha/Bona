import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await connectMongoDB();

    // Find user with this email change token
    const user = await User.findOne({
      emailChangeToken: token,
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Update email
    user.email = user.pendingEmail!;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    // Redirect to profile with success message
    const redirectUrl = new URL("/dashboard/profile", request.url);
    redirectUrl.searchParams.set("emailChanged", "true");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Email change confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
