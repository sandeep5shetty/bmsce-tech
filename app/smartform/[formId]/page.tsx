import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { auth } from "@/lib/auth";
import db from "@/db";
import { smartForm } from "@/db/schema";
import type { SmartFormSchema } from "@/actions/smartform";

import { SmartFormFill } from "./form-client";

type PageProps = { params: Promise<{ formId: string }> };

export default async function FormFillPage({ params }: PageProps) {
  const { formId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/smartform/${formId}`);
  }

  const form = await db.query.smartForm.findFirst({
    where: eq(smartForm.id, formId),
  });

  if (!form) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Form not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This link may be invalid or the form may have been deleted.
        </p>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This form is closed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          The form is no longer accepting responses.
        </p>
      </div>
    );
  }

  const schema = form.schema as SmartFormSchema;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{schema.title}</CardTitle>
          {schema.description && (
            <CardDescription>{schema.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <SmartFormFill
            formId={form.id}
            schema={schema}
            userEmail={session.user.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
