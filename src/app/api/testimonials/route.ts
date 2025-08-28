import { NextRequest, NextResponse } from "next/server";
import { TestimonialService } from "@/lib/services/testimonial.service";
import { TestimonialSchema } from "@/lib/models/testimonial.model";
import { z } from "zod";

// POST /api/testimonials - Submit a new testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = TestimonialSchema.parse(body);

    // Submit testimonial (will be pending approval)
    const testimonial = await TestimonialService.submitTestimonial(
      validatedData
    );

    return NextResponse.json(
      {
        message:
          "Testimonial submitted successfully! It will be reviewed before being published.",
        testimonial: {
          id: testimonial._id,
          content: testimonial.content,
          author: testimonial.author,
          submittedAt: testimonial.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting testimonial:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to submit testimonial",
      },
      { status: 500 }
    );
  }
}

// GET /api/testimonials - Get approved testimonials for public display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const testimonials = await TestimonialService.getApprovedTestimonials(
      limit
    );

    return NextResponse.json({
      testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch testimonials",
      },
      { status: 500 }
    );
  }
}
