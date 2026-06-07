import { NextResponse } from "next/server";

import { createQuestion, getAllQuestions } from "@/features/polls/lib/actions";
import { createQuestionSchema } from "@/features/polls/lib/validation";

export async function GET() {
  try {
    const questions = await getAllQuestions();
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const q = await createQuestion(parsed.data);
    return NextResponse.json(q, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
