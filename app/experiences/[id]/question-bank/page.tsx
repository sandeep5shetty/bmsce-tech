import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, FileText, Youtube } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { companyGradient, companyInitial } from "@/features/experiences/lib/company-color";
import { getExperience } from "@/features/experiences/lib/actions";

const resourceMeta = {
  pdf: { icon: FileText, label: "PDF", classes: "bg-red-500/15 text-red-600 dark:text-red-400" },
  youtube: {
    icon: Youtube,
    label: "YouTube",
    classes: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  text: {
    icon: FileText,
    label: "Note",
    classes: "bg-primary/15 text-primary",
  },
} as const;

export default async function ExperienceQuestionBankPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await getExperience(id);

  if (!experience) notFound();

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-3xl space-y-6 px-6">
      <div>
        <Link
          href={`/experiences/${experience.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {experience.companyName}
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-base font-extrabold text-white ${companyGradient(
              experience.companyName,
            )}`}
          >
            {companyInitial(experience.companyName)}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal">
              {experience.companyName} Question Bank
            </h1>
            <p className="text-muted-foreground text-sm">
              Shared by {experience.author.name ?? "the author"}
            </p>
          </div>
        </div>
      </div>

      {experience.resources.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No resources have been added for this experience yet.
        </p>
      ) : (
        <div className="space-y-3">
          {experience.resources.map((resource) => {
            const meta = resourceMeta[resource.type as keyof typeof resourceMeta];
            const Icon = meta.icon;
            return (
              <Card key={resource.id}>
                <CardContent className="flex items-start gap-3 py-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.classes}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    {resource.title && (
                      <p className="text-sm font-medium">{resource.title}</p>
                    )}
                    {resource.type === "text" ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {resource.content}
                      </p>
                    ) : (
                      <a
                        href={resource.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm break-all hover:underline"
                      >
                        {resource.content}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
