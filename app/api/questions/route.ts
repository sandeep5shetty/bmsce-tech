import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
=======
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,     
  key: process.env.PUSHER_KEY!,           
  secret: process.env.PUSHER_SECRET!,     
  cluster: process.env.PUSHER_CLUSTER!,   
  useTLS: true,
});
>>>>>>> 71dc632 (Added Livewall)

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        responses: {
          orderBy: { submittedAt: "asc" },
        },
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const question = await prisma.question.create({
      data: {
        question: body.question,
        type: body.type,
        audience: body.audience,
        isAnonymous: body.isAnonymous,
        requireName: body.requireName,
      },
    });

<<<<<<< HEAD
=======
    // 🔥 REALTIME EVENT
    await pusher.trigger("questions", "new-question", question);

>>>>>>> 71dc632 (Added Livewall)
    return NextResponse.json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
