import Link from "next/link";

import { Construction } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { ArrowRight, Home } from "@/components/icons";

interface UnderConstructionPageProps {
  title?: string;
  description?: string;
}

export function UnderConstructionPage({
  title = "Under Construction",
  description = "We're building something useful here. This section will be available soon — check back later.",
}: UnderConstructionPageProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-3 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="mb-4">
            <Construction className="text-primary h-16 w-16" />
          </EmptyMedia>
          <div className="space-y-2">
            <p className="text-primary text-sm font-medium tracking-wide uppercase">
              Coming soon
            </p>
            <EmptyTitle className="font-serif text-3xl">{title}</EmptyTitle>
          </div>
          <EmptyDescription className="max-w-md">{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
