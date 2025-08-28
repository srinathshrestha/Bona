import { NextRequest, NextResponse } from "next/server";
import { TestimonialService } from "@/lib/services/testimonial.service";

// Simple admin password check
const ADMIN_PASSWORD = "1r6zj7uknn";

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const password = authHeader.replace("Bearer ", "");
  return password === ADMIN_PASSWORD;
}

// GET /api/admin/testimonials - Get all testimonials for admin review
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!checkAdminAuth(request)) {
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
