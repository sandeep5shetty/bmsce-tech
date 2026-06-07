import { NextResponse } from "next/server";

import { submitResponse } from "@/features/polls/lib/actions";
import { submitResponseSchema } from "@/features/polls/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const r = await submitResponse(parsed.data);
    return NextResponse.json(r, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit";
    if (message === "Already submitted") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
