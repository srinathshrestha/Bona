"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TestimonialFormData {
  content: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  email?: string;
  website?: string;
}

export function TestimonialForm() {
  const [formData, setFormData] = useState<TestimonialFormData>({
    content: "",
    author: "",
    role: "",
    company: "",
    rating: 5,
    email: "",
    website: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit testimonial");
      }

      await response.json();

      setIsSubmitted(true);
      toast.success(
        "Testimonial submitted successfully! We'll review it before publishing."
      );

      // Reset form
      setFormData({
        content: "",
        author: "",
        role: "",
        company: "",
        rating: 5,
        email: "",
        website: "",
      });
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit testimonial"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
            <p className="text-muted-foreground mb-4">
              Your testimonial has been submitted and will be reviewed before
              being published.
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Submit Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <p className="text-muted-foreground">
          Help others discover Bona by sharing your experience with our
          platform.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <Label htmlFor="rating">Rating *</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formData.rating
                        ? "fill-primary text-primary"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial Content */}
          <div>
            <Label htmlFor="content">Your Testimonial *</Label>
            <Textarea
              id="content"
              placeholder="Tell us about your experience with Bona..."
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className="mt-2 min-h-[120px]"
              required
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.content.length}/500 characters
            </p>
          </div>

          {/* Author Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author">Your Name *</Label>
              <Input
                id="author"
                placeholder="John Doe"
                value={formData.author}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author: e.target.value }))
                }
                className="mt-2"
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="role">Your Role</Label>
              <Input
                id="role"
                placeholder="Creative Director"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="mt-2"
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Your Company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                className="mt-2"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.content.trim() ||
              !formData.author.trim()
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Testimonial
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            All testimonials are reviewed before being published. By submitting,
            you agree to our terms.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
