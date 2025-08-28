"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Check, X, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

interface Testimonial {
  _id: string;
  content: string;
  author: string;
  role?: string;
  company?: string;
  rating: number;
  isApproved: boolean;
  isPublic: boolean;
  email?: string;
  website?: string;
  submittedAt: Date;
  approvedAt?: Date;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  useEffect(() => {
    // Check if password is stored in sessionStorage
    const storedPassword = sessionStorage.getItem("adminPassword");
    if (storedPassword) {
      setAdminPassword(storedPassword);
      setIsAuthenticated(true);
      fetchTestimonials(storedPassword);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      // Test the password by making a request
      const response = await fetch("/api/admin/testimonials", {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        setAdminPassword(password);
        setIsAuthenticated(true);
        sessionStorage.setItem("adminPassword", password);
        await fetchTestimonials(password);
        toast.success("Login successful");
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const fetchTestimonials = useCallback(
    async (authPassword?: string) => {
      const passwordToUse = authPassword || adminPassword;
      if (!passwordToUse) return;

      try {
        const response = await fetch("/api/admin/testimonials", {
          headers: {
            Authorization: `Bearer ${passwordToUse}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setIsAuthenticated(false);
            setAdminPassword(null);
            sessionStorage.removeItem("adminPassword");
            toast.error("Session expired. Please login again.");
            return;
          }
          throw new Error("Failed to fetch testimonials");
        }

        const data = await response.json();
        setTestimonials(data.testimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        toast.error("Failed to load testimonials");
      } finally {
        setIsLoading(false);
      }
    },
    [adminPassword]
  );

  const handleApprove = async (id: string) => {
    if (!adminPassword) return;

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/admin/testimonials/${id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminPassword}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve testimonial");
      }

      await fetchTestimonials(); // Refresh the list
      toast.success("Testimonial approved successfully");
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast.error("Failed to approve testimonial");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!adminPassword) return;

    if (
      !confirm("Are you sure you want to reject and delete this testimonial?")
    ) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/admin/testimonials/${id}/approve`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminPassword}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reject testimonial");
      }

      await fetchTestimonials(); // Refresh the list
      toast.success("Testimonial rejected and deleted");
    } catch (error) {
      console.error("Error rejecting testimonial:", error);
      toast.error("Failed to reject testimonial");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                disabled={isAuthenticating || !password.trim()}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const pendingTestimonials = testimonials.filter((t) => !t.isApproved);
  const approvedTestimonials = testimonials.filter((t) => t.isApproved);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword(null);
    sessionStorage.removeItem("adminPassword");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Testimonials Management
            </h1>
            <p className="text-muted-foreground">
              Review and manage user testimonials. {pendingTestimonials.length}{" "}
              pending approval.
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>

        {/* Pending Testimonials */}
        {pendingTestimonials.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">
              Pending Approval ({pendingTestimonials.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial._id}
                  testimonial={testimonial}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingIds.has(testimonial._id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Approved Testimonials */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Approved Testimonials ({approvedTestimonials.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {approvedTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial._id}
                testimonial={testimonial}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processingIds.has(testimonial._id)}
                isApproved={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  onApprove,
  onReject,
  isProcessing,
  isApproved = false,
}: {
  testimonial: Testimonial;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
  isApproved?: boolean;
}) {
  return (
    <Card
      className={`${
        !testimonial.isApproved ? "border-yellow-200 bg-yellow-50/50" : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{testimonial.author}</CardTitle>
            {testimonial.role && testimonial.company && (
              <p className="text-sm text-muted-foreground">
                {testimonial.role} at {testimonial.company}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant={testimonial.isApproved ? "default" : "secondary"}>
              {testimonial.isApproved ? "Approved" : "Pending"}
            </Badge>
            {testimonial.isPublic ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
        </div>

        <blockquote className="text-sm text-muted-foreground mb-4 leading-relaxed">
          &ldquo;{testimonial.content}&rdquo;
        </blockquote>

        {testimonial.email && (
          <p className="text-xs text-muted-foreground mb-2">
            Email: {testimonial.email}
          </p>
        )}

        {testimonial.website && (
          <p className="text-xs text-muted-foreground mb-4">
            Website: {testimonial.website}
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-4">
          Submitted: {new Date(testimonial.submittedAt).toLocaleDateString()}
        </p>

        {!isApproved && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(testimonial._id)}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(testimonial._id)}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
