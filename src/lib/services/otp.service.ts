import bcrypt from "bcryptjs";
import { Otp, IOtp, OtpPurpose } from "@/lib/models/otp.model";
import { connectToDatabase } from "@/lib/database";

const OTP_TTL_MINUTES = 10;
const SALT_ROUNDS = 10;

function generateNumericOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export class OtpService {
  static async createAndSendOtp(
    email: string,
    purpose: OtpPurpose,
    send: (email: string, code: string) => Promise<void>
  ): Promise<void> {
    await connectToDatabase();

    // Invalidate previous active OTPs for this purpose
    await Otp.updateMany(
      { email, purpose, consumed: false },
      { $set: { consumed: true } }
    );

    const code = generateNumericOtp(6);
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await Otp.create({
      email,
      codeHash,
      purpose,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      consumed: false,
    });

    await send(email, code);
  }

  static async verifyOtp(
    email: string,
    purpose: OtpPurpose,
    code: string
  ): Promise<boolean> {
    await connectToDatabase();

    const record: IOtp | null = await Otp.findOne({
      email,
      purpose,
      consumed: false,
    }).sort({ createdAt: -1 });
    if (!record) return false;

    if (record.expiresAt.getTime() < Date.now()) {
      return false;
    }

    if (record.attempts >= record.maxAttempts) {
      return false;
    }

    const isMatch = await bcrypt.compare(code, record.codeHash);
    record.attempts += 1;

    if (isMatch) {
      record.consumed = true;
      await record.save();
      return true;
    }

    await record.save();
    return false;
  }
}
