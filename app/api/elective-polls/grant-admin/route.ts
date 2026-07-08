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

  const expectedCode = process.env.ELECTIVE_POLL_ADMIN_CODE;
  if (!expectedCode) {
    return NextResponse.json(
      { error: "Elective poll admin code not configured on server" },
      { status: 500 },
    );
  }

  if (code !== expectedCode) {
    return NextResponse.json({ error: "Invalid code" }, { status: 403 });
  }

  await db
    .update(user)
    .set({ isElectivePollAdmin: true })
    .where(eq(user.id, currentUser.id));

  return NextResponse.json({
    success: true,
    message: "You can now create and manage elective polls.",
  });
}
