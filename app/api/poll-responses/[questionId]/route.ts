import { NextResponse } from "next/server";

import { getResponsesForQuestion } from "@/features/polls/lib/actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const { questionId } = await params;
    const responses = await getResponsesForQuestion(questionId);
    return NextResponse.json(responses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
  }
}
