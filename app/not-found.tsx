import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { ArrowRight, Home, NotFound as NotFoundIcon } from "@/components/icons";

const NotFound = () => {
  return (
    <div className="container mx-auto flex max-w-3xl items-center justify-center px-3 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="mb-4">
            <NotFoundIcon className="h-16 w-16" />
          </EmptyMedia>
          <div className="space-y-2">
            <h1 className="font-serif text-7xl font-bold tracking-tight">
              404
            </h1>
            <EmptyTitle className="text-2xl">Page Not Found</EmptyTitle>
          </div>
          <EmptyDescription className="max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </EmptyDescription>
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
};

export default NotFound;
