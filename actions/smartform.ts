"use server";

import { desc, eq, count } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/db";
import { smartForm, smartResponse } from "@/db/schema";

export type MySubmission = {
  id: string;
  formId: string;
  formTitle: string;
  formSchema: SmartFormSchema;
  answers: Record<string, unknown>;
  submittedAt: string;
};

export type SmartFormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
};

export type SmartFormSchema = {
  title: string;
  description: string;
  fields: SmartFormField[];
};

export type SmartFormSummary = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  responseCount: number;
  schema: SmartFormSchema;
};

export async function listSmartForms(): Promise<SmartFormSummary[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const results = await db
    .select({
      id: smartForm.id,
      title: smartForm.title,
      description: smartForm.description,
      createdAt: smartForm.createdAt,
      isActive: smartForm.isActive,
      schema: smartForm.schema,
      responseCount: count(smartResponse.id),
    })
    .from(smartForm)
    .leftJoin(smartResponse, eq(smartResponse.formId, smartForm.id))
    .where(eq(smartForm.createdBy, session.user.id))
    .groupBy(smartForm.id)
    .orderBy(desc(smartForm.createdAt));

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
    isActive: r.isActive,
    responseCount: Number(r.responseCount),
    schema: r.schema as SmartFormSchema,
  }));
}

export async function listMySubmissions(): Promise<MySubmission[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const results = await db
    .select({
      id: smartResponse.id,
      formId: smartResponse.formId,
      formTitle: smartForm.title,
      formSchema: smartForm.schema,
      answers: smartResponse.answers,
      submittedAt: smartResponse.submittedAt,
    })
    .from(smartResponse)
    .innerJoin(smartForm, eq(smartResponse.formId, smartForm.id))
    .where(eq(smartResponse.submittedBy, session.user.id))
    .orderBy(desc(smartResponse.submittedAt));

  return results.map((r) => ({
    id: r.id,
    formId: r.formId,
    formTitle: r.formTitle,
    formSchema: r.formSchema as SmartFormSchema,
    answers: r.answers as Record<string, unknown>,
    submittedAt: r.submittedAt.toISOString(),
  }));
}
