import { NextRequest, NextResponse } from "next/server";
import { TestimonialService } from "@/lib/services/testimonial.service";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const provided = authHeader.replace("Bearer ", "");
  const expected = process.env.ADMIN_PANEL_PASSWORD || "";
  return provided === expected;
}

// GET /api/admin/testimonials - Get all testimonials for admin review
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await TestimonialService.getAllTestimonials(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching testimonials for admin:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch testimonials",
      },
      { status: 500 }
    );
  }
}
