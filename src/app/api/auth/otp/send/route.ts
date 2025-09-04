import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email.service";
import { OtpService } from "@/lib/services/otp.service";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose } = await req.json();
    if (!email || !purpose) {
      return NextResponse.json(
        { error: "Email and purpose are required" },
        { status: 400 }
      );
    }

    await OtpService.createAndSendOtp(email, purpose, async (to, code) => {
      const headingMap: Record<string, string> = {
        verify_email: "Verify your email",
        reset_password: "Reset password",
        change_email: "Confirm email change",
      };
      const subtextMap: Record<string, string> = {
        verify_email: "Enter this code in Bona to verify your email address.",
        reset_password: "Enter this code to securely reset your password.",
        change_email: "Enter this code to confirm your new email address.",
      };

      await emailService.sendOtpEmail(
        to,
        code,
        headingMap[purpose] || "Your verification code",
        subtextMap[purpose] || "Use this code to continue."
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
