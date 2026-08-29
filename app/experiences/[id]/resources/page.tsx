import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "@/features/experiences/components/company-avatar";
import {
  documentHref,
  documentMeta,
  formatFileSize,
} from "@/features/experiences/components/document-link";
import { getExperience } from "@/features/experiences/lib/actions";
import { DocumentType } from "@/features/experiences/lib/validation";

export default async function ExperienceResourcesPage({
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
          <CompanyAvatar
            companyName={experience.companyName}
            logoUrl={experience.companyLogoUrl}
            size="h-11 w-11 rounded-xl text-base"
          />
          <div>
            <h1 className="font-serif text-2xl font-normal">
              {experience.companyName} Resources
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
            const meta = documentMeta(resource.type as DocumentType);
            const Icon = meta.icon;
            return (
              <Card key={resource.id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.classes}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium">
                      {resource.title}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {meta.label}
                      {resource.fileSize
                        ? ` · ${formatFileSize(resource.fileSize)}`
                        : ""}
                      {resource.fileName ? ` · ${resource.fileName}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={documentHref(resource.content, resource.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
