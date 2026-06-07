import { NextResponse } from "next/server";

import { submitResponse } from "@/features/placement/lib/actions";
import { submitResponseSchema } from "@/features/placement/lib/validation";

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
    await submitResponse(parsed.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit";
    if (message === "Already submitted") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.startsWith("Not eligible")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
