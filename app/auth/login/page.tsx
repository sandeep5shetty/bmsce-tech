"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useRouter as useBProgressRouter } from "@bprogress/next";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { signIn, signInSocial } from "@/actions/auth";

import { resolveAuthErrorMessage } from "@/lib/auth-errors";

import { SignInSchema } from "@/types/auth";

import { signInSchema } from "@/validation/auth";

import {
  EyeClose,
  EyeOpen,
  Google,
  Loader,
  Lock,
  Mail,
} from "@/components/icons";

const Login = () => {
  const router = useBProgressRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const oauthError = resolveAuthErrorMessage(
    searchParams.get("error"),
    searchParams.get("error_description"),
  );
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInSchema,
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async () => {
      await signInMutation(form.state.values);
    },
  });

  const {
    mutateAsync: signInMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      // Invalidate user query to update navbar
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Successfully logged in!");
      router.push(callbackUrl);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong!");
    },
  });

  const handleSocialLogin = async (provider: "google" | "github") => {
    await signInSocial(provider);
  };

  return (
    <div className="bg-background my-16 flex items-center justify-center px-4 sm:my-32">
      <div className="flex w-full flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="text-muted-foreground font-serif text-3xl sm:text-4xl">
            Welcome back!
          </h1>
          <p className="text-foreground font-serif text-3xl sm:text-5xl">
            Login to your account.
          </p>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Only official BMSCE emails are accepted.
          </p>
        </div>
        <Card className="w-full max-w-md lg:mt-6">
          <CardContent className="space-y-4">
            {oauthError && (
              <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-4">
                <p className="text-destructive text-sm">{oauthError}</p>
              </div>
            )}

            {error && (
              <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-4">
                <p className="text-destructive text-sm">{error.message}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Mail />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="email"
                        type="email"
                        placeholder="yourname.branch@bmsce.ac.in"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isPending}
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                    </InputGroup>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Lock />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={(field.state.value as string) || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isPending}
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? <EyeClose /> : <EyeOpen />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader />}
                {isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("google")}
              >
                <Google />
                Google
              </Button>
              {/*  <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin("github")}
              >
                <Github />
                GitHub
              </Button> */}
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don&apos;t have an account?{" "}
              </span>
              <Link
                href="/auth/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
