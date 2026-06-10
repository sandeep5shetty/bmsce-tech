import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { EmailVerificationRequired } from "@/components/common/email-verification-required";

import { DashboardHeader } from "@/features/dashboard/components/header";

import { getUser } from "@/actions/user";

import { Login } from "@/components/icons";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUser();

  if (!user) {
    return (
      <div className="container mx-auto mt-6 mb-32 max-w-6xl px-4 sm:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Login />
            </EmptyMedia>
            <EmptyTitle>Authentication Required</EmptyTitle>
            <EmptyDescription>
              Please log in to view and manage your content.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/auth/login">
                <Login className="h-4 w-4" />
                Log In
              </Link>
            </Button>
          </div>
        </Empty>
      </div>
    );
  }

  if (!user.emailVerified) {
    return <EmailVerificationRequired />;
  }

  return (
    <div className="container mx-auto mt-6 mb-32 max-w-6xl space-y-6 px-4 sm:mt-8 sm:space-y-8 sm:px-6">
      <div className="space-y-6">
        <DashboardHeader name={user.name ?? undefined} />
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
