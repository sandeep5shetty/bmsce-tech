import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { questionId, answer, email } = body;

    if (!questionId || !answer || !email) {
      return NextResponse.json(
        { error: "Missing required fields (email, answer, questionId)" },
        { status: 400 }
      );
    }

    // ❗ prevent duplicate submissions from the same email
    const existing = await prisma.response.findFirst({
      where: { questionId, email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a response." },
        { status: 400 }
      );
    }

    // store clean response
    const response = await prisma.response.create({
      data: {
        questionId,
        answer,
        email, // Always required now
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error creating response:", error);

    // Prisma duplicate entry
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already submitted a response." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create response",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
