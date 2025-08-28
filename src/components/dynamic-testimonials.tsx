"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Testimonial {
  _id: string;
  content: string;
  author: string;
  role?: string;
  company?: string;
  rating: number;
  submittedAt: Date;
  approvedAt?: Date;
}

export function DynamicTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials?limit=12");

      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }

      const data = await response.json();
      // Sort by rating (highest first), then by approval date
      const sortedTestimonials = data.testimonials.sort(
        (a: Testimonial, b: Testimonial) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating; // Higher rating first
          }
          // If ratings are equal, sort by approval date (newest first)
          if (a.approvedAt && b.approvedAt) {
            return (
              new Date(b.approvedAt).getTime() -
              new Date(a.approvedAt).getTime()
            );
          }
          // If no approval date, sort by submission date
          return (
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
          );
        }
      );

      setTestimonials(sortedTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setError("Failed to load testimonials");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Loved by creative teams worldwide
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Join thousands of designers, agencies, and creative teams who
              trust Bona with their most important work.
            </p>
          </div>

          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  // Handle error - show fallback testimonials
  if (error) {
    return <FallbackTestimonials />;
  }

  // Handle no testimonials - show encouraging message
  if (testimonials.length === 0) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Be the first to share your experience
            </h2>
            <p className="text-xl text-muted-foreground text-pretty mb-8">
              Help other creative teams discover Bona by sharing your experience
              with our platform.
            </p>
            <Button asChild className="inline-flex items-center gap-2">
              <Link href="/testimonial">
                Share Your Experience
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
            Loved by creative teams worldwide
          </h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Join thousands of designers, agencies, and creative teams who trust
            Bona with their most important work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial._id} testimonial={testimonial} />
          ))}
        </div>

        {/* CTA to add testimonial */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Love using Bona? Help others discover us!
          </p>
          <Button
            asChild
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <Link href="/testimonial">
              Share Your Experience
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="pt-6">
        <div className="flex mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
        </div>
        <blockquote className="text-muted-foreground mb-6 leading-relaxed">
          &ldquo;{testimonial.content}&rdquo;
        </blockquote>
        <div>
          <div className="font-semibold text-foreground">
            {testimonial.author}
          </div>
          {testimonial.role && testimonial.company && (
            <div className="text-sm text-muted-foreground">
              {testimonial.role} at {testimonial.company}
            </div>
          )}
          {testimonial.role && !testimonial.company && (
            <div className="text-sm text-muted-foreground">
              {testimonial.role}
            </div>
          )}
          {!testimonial.role && testimonial.company && (
            <div className="text-sm text-muted-foreground">
              {testimonial.company}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FallbackTestimonials() {
  const fallbackTestimonials = [
    {
      _id: "fallback-1",
      content:
        "Bona completely transformed how our design team collaborates. The 50GB free tier saved us hundreds monthly compared to other platforms.",
      author: "Sarah Chen",
      role: "Creative Director",
      company: "Pixel Studio",
      rating: 5,
      submittedAt: new Date(),
    },
    {
      _id: "fallback-2",
      content:
        "The zero-knowledge encryption gives us peace of mind when handling sensitive client assets. Setup was incredibly fast.",
      author: "Marcus Rodriguez",
      role: "Founder",
      company: "RedLine Agency",
      rating: 5,
      submittedAt: new Date(),
    },
    {
      _id: "fallback-3",
      content:
        "Finally, a file sharing solution that doesn't cost a fortune per user. The team collaboration features are exactly what we needed.",
      author: "Emily Thompson",
      role: "Project Manager",
      company: "Creative Collective",
      rating: 5,
      submittedAt: new Date(),
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
            Loved by creative teams worldwide
          </h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Join thousands of designers, agencies, and creative teams who trust
            Bona with their most important work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {fallbackTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial._id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
