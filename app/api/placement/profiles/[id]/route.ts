import { NextResponse } from "next/server";

import { upsertProfile } from "@/features/placement/lib/actions";
import { upsertProfileSchema } from "@/features/placement/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params; // id is the profile id but we update by userId
    const body = await req.json();
    const parsed = upsertProfileSchema.safeParse({
      ...body,
      cgpa: Number(body.cgpa),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    await upsertProfile(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
