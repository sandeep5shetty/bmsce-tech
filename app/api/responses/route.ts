import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Build the data object conditionally
    const data: {
      questionId: string;
      answer: string;
      studentId?: string | null;
      name?: string | null;
    } = {
      questionId: body.questionId,
      answer: body.answer,
    };

    // Only include studentId if it's provided and not null
    if (body.studentId) {
      data.studentId = body.studentId;
    }

    // Only include name if it's provided and not null
    if (body.name) {
      data.name = body.name;
    }

    const response = await prisma.response.create({
      data,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating response:", error);
    return NextResponse.json(
      {
        error: "Failed to create response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
