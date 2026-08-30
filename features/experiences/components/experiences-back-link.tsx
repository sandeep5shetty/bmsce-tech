import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExperiencesBackLink() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/experiences">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Experiences
      </Link>
    </Button>
  );
}
