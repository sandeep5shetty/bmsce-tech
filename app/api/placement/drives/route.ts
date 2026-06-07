import { NextResponse } from "next/server";

import { getAllDrives, createDrive } from "@/features/placement/lib/actions";
import { createDriveSchema } from "@/features/placement/lib/validation";

export async function GET() {
  try {
    const drives = await getAllDrives();
    return NextResponse.json(drives);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch drives" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createDriveSchema.safeParse({
      ...body,
      minCgpa: Number(body.minCgpa),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const drive = await createDrive(parsed.data);
    return NextResponse.json(drive, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create drive";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
