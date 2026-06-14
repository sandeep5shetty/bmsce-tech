import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code } = body as { code?: string };

  const expectedCode = process.env.COORDINATOR_CODE;
  if (!expectedCode) {
    return NextResponse.json({ error: "Not configured on server" }, { status: 500 });
  }

  if (!code || code !== expectedCode) {
    return NextResponse.json({ error: "Invalid admin code" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
