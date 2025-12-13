import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
=======
import Pusher from "pusher";

// 🔥 Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
>>>>>>> 71dc632 (Added Livewall)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
<<<<<<< HEAD

=======
>>>>>>> 71dc632 (Added Livewall)
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

<<<<<<< HEAD
    // store clean response
=======
    // ✅ Store response
>>>>>>> 71dc632 (Added Livewall)
    const response = await prisma.response.create({
      data: {
        questionId,
        answer,
<<<<<<< HEAD
        email, // Always required now
      },
    });

=======
        email,
      },
    });

    // 🔥🔥🔥 THIS WAS MISSING — REALTIME PUSH 🔥🔥🔥
    await pusher.trigger(
      `question-${questionId}`, // channel
      "new-response",           // event
      response                  // payload
    );

>>>>>>> 71dc632 (Added Livewall)
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error creating response:", error);

<<<<<<< HEAD
    // Prisma duplicate entry
=======
>>>>>>> 71dc632 (Added Livewall)
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
