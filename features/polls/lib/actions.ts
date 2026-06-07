"use server";

import { revalidatePath } from "next/cache";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getUser } from "@/actions/user";

import db from "@/db";
import { question, response, student } from "@/db/schema";

import { CreateQuestionInput } from "./validation";

export async function createQuestion(data: CreateQuestionInput) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const [q] = await db
    .insert(question)
    .values({
      question: data.question,
      type: data.type,
      audience: data.audience,
      isAnonymous: data.isAnonymous,
      requireName: data.audience === "cr-only",
    })
    .returning();

  if (!q) throw new Error("Failed to create question");

  revalidatePath("/questions");
  return q;
}

export async function getAllQuestions() {
  return db.query.question.findMany({
    orderBy: desc(question.createdAt),
    with: { responses: { orderBy: desc(response.submittedAt) } },
  });
}

export async function getQuestion(id: string) {
  return db.query.question.findFirst({
    where: eq(question.id, id),
    with: { responses: { orderBy: desc(response.submittedAt) } },
  });
}

export async function getResponsesForQuestion(questionId: string) {
  return db.query.response.findMany({
    where: eq(response.questionId, questionId),
    orderBy: desc(response.submittedAt),
  });
}

export async function submitResponse(data: {
  questionId: string;
  answer: string;
  email: string;
  studentName?: string;
}) {
  const q = await db.query.question.findFirst({
    where: eq(question.id, data.questionId),
  });
  if (!q) throw new Error("Question not found");

  const existing = await db.query.response.findFirst({
    where: and(
      eq(response.questionId, data.questionId),
      eq(response.email, data.email),
    ),
  });
  if (existing) throw new Error("Already submitted");

  const [r] = await db
    .insert(response)
    .values({
      questionId: data.questionId,
      answer: data.answer,
      email: data.email,
      studentName: data.studentName ?? null,
    })
    .returning();

  revalidatePath(`/questions`);
  return r;
}

export async function getStudents(search?: string) {
  if (search) {
    return db.query.student.findMany({
      where: or(
        ilike(student.name, `%${search}%`),
        ilike(student.usn, `%${search}%`),
      ),
      orderBy: student.name,
    });
  }
  return db.query.student.findMany({ orderBy: student.name });
}

export async function getSectionBStudents() {
  return db.query.student.findMany({
    where: eq(student.section, "B"),
    orderBy: student.name,
  });
}
