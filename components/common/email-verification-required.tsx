"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { resendVerificationEmail } from "@/actions/auth";

import { Loader, Mail } from "@/components/icons";

export function EmailVerificationRequired() {
  const { mutate: resendEmail, isPending } = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send verification email");
    },
  });

  return (
    <div className="container mx-auto mt-6 mb-32 max-w-6xl px-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyTitle>Email Verification Required</EmptyTitle>
          <EmptyDescription>
            Please verify your email to continue. Check your inbox for the
            verification link.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button onClick={() => resendEmail()} disabled={isPending}>
            {isPending ? (
              <Loader className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {isPending ? "Sending..." : "Resend Email"}
          </Button>
        </div>
      </Empty>
    </div>
  );
}
