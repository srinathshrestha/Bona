import { NextRequest, NextResponse } from "next/server";
import { FeedbackService } from "@/lib/services/feedback.service";

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  if (!header) return false;
  const provided = header.replace("Bearer ", "");
  const expected = process.env.ADMIN_PANEL_PASSWORD || "";
  return provided === expected;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = (await params).id;
    const deleted = await FeedbackService.remove(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
