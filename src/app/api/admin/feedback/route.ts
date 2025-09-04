import { NextRequest, NextResponse } from "next/server";
import { FeedbackService } from "@/lib/services/feedback.service";

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  if (!header) return false;
  const provided = header.replace("Bearer ", "");
  const expected = process.env.ADMIN_PANEL_PASSWORD || "";
  return provided === expected;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const feedback = await FeedbackService.listAll(200);
    return NextResponse.json({ feedback });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
