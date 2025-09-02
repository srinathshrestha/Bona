import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find user with this verification token
    const user = await User.findByEmailVerificationToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.emailVerified = new Date();
    user.emailVerificationToken = undefined;
    await user.save();

    // Redirect to sign-in page with success message
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("verified", "true");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
