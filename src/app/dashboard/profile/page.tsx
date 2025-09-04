"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// User interface for profile data
interface UserProfile {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  avatar?: string;
  emailVerified?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const changePwd = useRef({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const changeEmail = useRef({ newEmail: "", code: "", currentPassword: "" });
  const [feedback, setFeedback] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    profileGradient: "",
  });

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          username: data.user.username || "",
          bio: data.user.bio || "",
          profileGradient:
            (data.user.settings?.profileGradient as string) || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          settings: { profileGradient: formData.profileGradient },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast.success("Profile updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                Profile Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                {/* Show avatar image if present, else show gradient preview if set, else placeholder */}
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : formData.profileGradient ? (
                  <div
                    className="w-16 h-16 rounded-full border"
                    style={{ background: formData.profileGradient }}
                    aria-label="Profile gradient preview"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">
                    {user?.username || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Member since{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="Choose a unique username"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  This will be your unique identifier on the platform
                </p>
              </div>

              {/* Display Name removed by product decision */}

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/160 characters
                </p>
              </div>

              {/* Profile Gradient Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Profile Gradient
                </label>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full border"
                    style={{
                      background: formData.profileGradient || "#e5e7eb",
                    }}
                    title="Preview"
                  />
                  <input
                    type="text"
                    value={formData.profileGradient}
                    onChange={(e) =>
                      handleChange("profileGradient", e.target.value)
                    }
                    placeholder="e.g. linear-gradient(135deg, #34d399, #60a5fa)"
                    className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "linear-gradient(135deg, #34d399 0%, #60a5fa 100%)",
                    "linear-gradient(135deg, #f472b6 0%, #f59e0b 100%)",
                    "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
                    "linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)",
                    "radial-gradient(circle at 30% 30%, #f472b6, #60a5fa)",
                  ].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange("profileGradient", g)}
                      className="w-10 h-10 rounded-full border"
                      style={{ background: g }}
                      aria-label="Pick gradient"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => handleChange("profileGradient", "")}
                    className="px-2 py-1 text-xs border rounded-md text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: Paste any valid CSS gradient value.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">Account ID</p>
                  <p className="text-muted-foreground">{user?.id}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Created</p>
                  <p className="text-muted-foreground">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Last Updated</p>
                  <p className="text-muted-foreground">
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Options */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Change Password */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Change Password
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) =>
                        (changePwd.current.currentPassword = e.target.value)
                      }
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) =>
                        (changePwd.current.newPassword = e.target.value)
                      }
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) =>
                        (changePwd.current.confirmPassword = e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/users/change-password",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(changePwd.current),
                            }
                          );
                          if (res.ok)
                            toast.success("Password updated successfully");
                          else {
                            const err = await res.json();
                            toast.error(
                              err.error || "Failed to change password"
                            );
                          }
                        } catch {
                          toast.error("Failed to change password");
                        }
                      }}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>

                {/* Change Email (OTP) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Change Email
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 overflow-hidden">
                    {/* New email */}
                    <div className="min-w-0">
                      <input
                        type="email"
                        placeholder="New email"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) =>
                          (changeEmail.current.newEmail = e.target.value)
                        }
                      />
                    </div>

                    {/* Send code button */}
                    <div className="min-w-0">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              "/api/users/change-email/request",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  newEmail: changeEmail.current.newEmail,
                                }),
                              }
                            );
                            if (res.ok)
                              toast.success(
                                "Verification code sent to new email"
                              );
                            else toast.error("Failed to send code");
                          } catch {
                            toast.error("Failed to send code");
                          }
                        }}
                      >
                        Send Code
                      </Button>
                    </div>

                    {/* Enter code */}
                    <div className="min-w-0">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) =>
                          (changeEmail.current.code = e.target.value)
                        }
                      />
                    </div>

                    {/* Current password */}
                    <div className="min-w-0">
                      <input
                        type="password"
                        placeholder="Current password"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) =>
                          (changeEmail.current.currentPassword = e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/users/change-email/confirm",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(changeEmail.current),
                            }
                          );
                          if (res.ok) {
                            toast.success("Email updated successfully");
                            fetchUserProfile();
                          } else {
                            const err = await res.json();
                            toast.error(err.error || "Failed to change email");
                          }
                        } catch {
                          toast.error("Failed to change email");
                        }
                      }}
                    >
                      Update Email
                    </Button>
                  </div>
                </div>

                {/* Removed quick-send OTP buttons as per request */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Help Us Improve */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Help us improve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share your experience or leave a testimonial to help us improve
              Bona.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/testimonial">
                <Button variant="outline" size="sm">
                  Open Testimonial Page
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Quick feedback
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what went well or what we can improve..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!feedback.trim()) {
                      toast.error("Please enter feedback before submitting");
                      return;
                    }
                    try {
                      const res = await fetch("/api/feedback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          content: feedback.trim(),
                          author: user?.username || user?.email || "Anonymous",
                          email: user?.email,
                        }),
                      });
                      if (res.ok) {
                        toast.success("Thanks for your feedback!");
                        setFeedback("");
                      } else {
                        const err = (await res.json().catch(() => ({
                          error: "Failed to submit feedback",
                        }))) as {
                          error?: string;
                        };
                        toast.error(err.error ?? "Failed to submit feedback");
                      }
                    } catch {
                      toast.error("Failed to submit feedback");
                    }
                  }}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
