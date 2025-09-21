import { NextRequest, NextResponse } from "next/server";
import { TestimonialService } from "@/lib/services/testimonial.service";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const provided = authHeader.replace("Bearer ", "");
  const expected = process.env.ADMIN_PANEL_PASSWORD || "";
  return provided === expected;
}

// PATCH /api/admin/testimonials/[id]/approve - Approve a testimonial
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testimonialId = (await params).id;
    const testimonial = await TestimonialService.approveTestimonial(
      testimonialId,
      "admin"
    );

    if (!testimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Testimonial approved successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    return NextResponse.json(
      {
        error: "Failed to approve testimonial",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/testimonials/[id]/approve - Reject/delete a testimonial
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testimonialId = (await params).id;
    const testimonial = await TestimonialService.rejectTestimonial(
      testimonialId
    );

    if (!testimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Testimonial rejected and deleted successfully",
    });
  } catch (error) {
    console.error("Error rejecting testimonial:", error);
    return NextResponse.json(
      {
        error: "Failed to reject testimonial",
      },
      { status: 500 }
    );
  }
}
