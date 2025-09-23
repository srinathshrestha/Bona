"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingVerify, setPendingVerify] = useState<{ email: string } | null>(
    null
  );

  // Get redirect URL from query params or default to onboarding
  const redirectUrl = searchParams.get("redirect") || "/onboarding";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });

  const passwordScore = (() => {
    const pwd = formData.password || "";
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP first; do NOT create user yet
      await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          purpose: "verify_email",
        }),
      });
      setPendingVerify({ email: formData.email });
      toast.success("We sent a verification code to your email.");
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const [verifyCode, setVerifyCode] = useState("");
  const handleVerify = async () => {
    if (!pendingVerify?.email || !verifyCode) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingVerify.email,
          purpose: "verify_email",
          code: verifyCode,
        }),
      });
      if (!res.ok) {
        toast.error("Invalid or expired code");
        return;
      }
      // Create account only after successful verification
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create account");
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        router.push("/sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-up removed

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="text-muted-foreground">
            Join Bona to start collaborating on creative projects
          </p>
        </div>

        {/* Sign Up Card */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Registration Form */}
            {!pendingVerify && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={isLoading}
                    autoComplete="username"
                    pattern="^[a-zA-Z0-9_-]+$"
                    title="Username can only contain letters, numbers, hyphens, and underscores"
                  />
                </div>

                {/* Display Name removed by product decision */}

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(passwordScore / 4) * 100}%`,
                        background:
                          passwordScore >= 3
                            ? "#10b981"
                            : passwordScore === 2
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use 8+ chars with upper, lower, number, symbol.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            {/* Verification Step */}
            {pendingVerify && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to{" "}
                  <strong>{pendingVerify.email}</strong>
                </p>
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerify}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Verify and Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={async () => {
                      await fetch("/api/auth/otp/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: pendingVerify.email,
                          purpose: "verify_email",
                        }),
                      });
                      toast.success("Code re-sent");
                    }}
                  >
                    Resend
                  </Button>
                </div>
              </div>
            )}

            {/* Social sign-up removed */}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-xs">
            By creating an account, you agree to our
            <Link href="/terms" className="text-primary hover:text-primary/80">
              {" "}
              Terms & Conditions
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
