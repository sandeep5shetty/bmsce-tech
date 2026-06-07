import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CreateDriveForm } from "@/features/placement/components/create-drive-form";

export default function CreateDrivePage() {
  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/placement">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to drives
          </Link>
        </Button>
      </div>
      <CreateDriveForm />
    </div>
  );
}
