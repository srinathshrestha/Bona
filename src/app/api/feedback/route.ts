import { NextRequest, NextResponse } from "next/server";
import { FeedbackService } from "@/lib/services/feedback.service";

export async function POST(request: NextRequest) {
  try {
    const { content, author, email } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    const doc = await FeedbackService.submit(content.trim(), author, email);
    return NextResponse.json({ feedback: { id: doc._id } }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
