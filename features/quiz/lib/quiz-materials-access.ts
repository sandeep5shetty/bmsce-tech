import { and, eq } from "drizzle-orm";

import db from "@/db";
import { quizEvent } from "@/db/schema";

export async function getOwnedEvent(adminId: string, eventId: string) {
  return db.query.quizEvent.findFirst({
    where: and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, adminId)),
    columns: { id: true },
  });
}
