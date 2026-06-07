"use client";

import { Suspense, useState } from "react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@bprogress/next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

import { GraduationCap } from "lucide-react";

import { studentSignIn } from "@/actions/auth";

import { Loader, Lock, Mail } from "@/components/icons";

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/placement";
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ email, usn }: { email: string; usn: string }) =>
      studentSignIn(email, usn),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(
        data.registered
          ? "Account created! Welcome to Placement Pulse."
          : "Signed in successfully.",
      );
      router.push(callbackUrl);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Sign-in failed. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !usn.trim()) return;
    mutateAsync({ email: email.trim(), usn: usn.trim().toUpperCase() });
  }

  return (
    <div className="bg-background my-32 flex items-center justify-center px-4">
      <div className="flex w-full flex-col items-center gap-4">
        <div className="text-center">
          <h2 className="text-foreground font-serif text-5xl">
            MCA Student <span className="italic">Login</span>.
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm tracking-tight">
            Use your BMSCE college email and USN to access Placement Pulse.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
            {error && (
              <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-4">
                <p className="text-destructive text-sm">
                  {error instanceof Error ? error.message : "Something went wrong."}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Mail />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="name.mca25@bmsce.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usn">USN (Password)</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Lock />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="usn"
                    type="text"
                    placeholder="1BM25MC066"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    disabled={isPending}
                    required
                    className="font-mono tracking-widest"
                  />
                </InputGroup>
                <p className="text-muted-foreground text-xs">
                  Enter your USN in capital letters — this is your password.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isPending || !email || !usn}>
                {isPending ? (
                  <>
                    <Loader />
                    Signing in...
                  </>
                ) : (
                  <>
                    <GraduationCap className="mr-1.5 h-4 w-4" />
                    Sign In to Placement Pulse
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Not a student? </span>
              <Link
                href="/auth/login"
                className="text-primary font-medium hover:underline"
              >
                Regular login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense>
      <StudentLoginForm />
    </Suspense>
  );
}
