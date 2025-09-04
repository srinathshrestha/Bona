"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const requestReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      if (!res.ok) return toast.error("Failed to send reset code");
      toast.success("Reset code sent to your email");
      setStep("reset");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    if (!code || !newPassword || newPassword !== confirmPassword) {
      return toast.error("Check code and passwords match");
    }
    setLoading(true);
    try {
      const verify = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password", code }),
      });
      if (!verify.ok) return toast.error("Invalid or expired code");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      if (!res.ok) return toast.error("Failed to reset password");
      toast.success("Password reset, please sign in");
      router.push("/sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        {step === "request" ? (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={requestReset}
              disabled={loading}
              className="w-full"
            >
              Send Reset Code
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={confirmReset}
              disabled={loading}
              className="w-full"
            >
              Reset Password
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
