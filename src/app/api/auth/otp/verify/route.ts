import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/lib/services/otp.service";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose, code } = await req.json();
    if (!email || !purpose || !code) {
      return NextResponse.json(
        { error: "Email, purpose and code are required" },
        { status: 400 }
      );
    }

    const ok = await OtpService.verifyOtp(email, purpose, code);
    if (!ok) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
