import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { getUser } from "@/actions/user";
import db from "@/db";
import { user } from "@/db/schema";

export async function POST(req: NextRequest) {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { code } = body as { code?: string };

  const expectedCode = process.env.COORDINATOR_CODE;
  if (!expectedCode) {
    return NextResponse.json(
      { error: "Coordinator code not configured on server" },
      { status: 500 },
    );
  }

  if (code !== expectedCode) {
    return NextResponse.json({ error: "Invalid coordinator code" }, { status: 403 });
  }

  await db
    .update(user)
    .set({ isCoordinator: true })
    .where(eq(user.id, currentUser.id));

  return NextResponse.json({ success: true, message: "You are now a coordinator." });
}
