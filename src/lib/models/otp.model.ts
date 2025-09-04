import mongoose, { Schema, Model, Document } from "mongoose";

export type OtpPurpose = "verify_email" | "reset_password" | "change_email";

export interface IOtp extends Document {
  email: string;
  codeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      required: true,
      enum: ["verify_email", "reset_password", "change_email"],
    },
    attempts: { type: Number, required: true, default: 0 },
    maxAttempts: { type: Number, required: true, default: 5 },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1, consumed: 1, expiresAt: 1 });

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
