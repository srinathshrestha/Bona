import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { User } from "@/lib/models/user.model";
import { OtpService } from "@/lib/services/otp.service";
import { emailService } from "@/lib/services/email.service";
import connectMongoDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newEmail } = await req.json();
    if (!newEmail)
      return NextResponse.json(
        { error: "New email is required" },
        { status: 400 }
      );

    await connectMongoDB();
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing)
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );

    await OtpService.createAndSendOtp(
      newEmail,
      "change_email",
      async (to, code) => {
        await emailService.sendOtpEmail(
          to,
          code,
          "Confirm email change",
          "Enter this code in Bona to confirm your new email."
        );
      }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Change email request error:", e);
    return NextResponse.json(
      { error: "Failed to request email change" },
      { status: 500 }
    );
  }
}
