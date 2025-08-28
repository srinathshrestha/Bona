import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    content:
      "Bona completely transformed how our design team collaborates. The 50GB free tier saved us hundreds monthly compared to other platforms.",
    author: "Sarah Chen",
    role: "Creative Director",
    company: "Pixel Studio",
    rating: 5,
  },
  {
    content:
      "The zero-knowledge encryption gives us peace of mind when handling sensitive client assets. Setup was incredibly fast.",
    author: "Marcus Rodriguez",
    role: "Founder",
    company: "RedLine Agency",
    rating: 5,
  },
  {
    content:
      "Finally, a file sharing solution that doesn't cost a fortune per user. The team collaboration features are exactly what we needed.",
    author: "Emily Thompson",
    role: "Project Manager",
    company: "Creative Collective",
    rating: 5,
  },
];

export function Testimonials() {
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
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
