import { TestimonialForm } from "@/components/testimonial-form";

export default function TestimonialPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Share Your Experience
          </h1>
          <p className="text-xl text-muted-foreground">
            Help other creative teams discover Bona by sharing your experience
            with our platform. Your testimonial will be reviewed before being
            published.
          </p>
        </div>

        <TestimonialForm />

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            All testimonials are reviewed to ensure authenticity and quality.
            Thank you for helping us build trust with the creative community.
          </p>
        </div>
      </div>
    </div>
  );
}
