import { NextResponse } from "next/server";

import { getAllProfiles, upsertProfile } from "@/features/placement/lib/actions";
import { upsertProfileSchema } from "@/features/placement/lib/validation";

export async function GET() {
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
