"use client";

import { useState } from "react";

import { BadgeCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setExperienceVerified } from "../lib/actions";

export function VerifyExperienceButton({
  id,
  isVerified,
}: {
  id: string;
  isVerified: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(isVerified);

  async function handleToggle() {
    setPending(true);
    try {
      await setExperienceVerified(id, !verified);
      setVerified(!verified);
      toast.success(!verified ? "Marked as verified." : "Verification removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update verification",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={verified ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={pending}
    >
      {verified ? (
        <>
          <ShieldOff className="mr-1.5 h-4 w-4" />
          Unverify
        </>
      ) : (
        <>
          <BadgeCheck className="mr-1.5 h-4 w-4" />
          Mark Verified
        </>
      )}
    </Button>
  );
}
