"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter } from "@bprogress/next";
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

import { signInSocial, signUp } from "@/actions/auth";

import { SignUpWithConfirmSchema } from "@/types/auth";

import { signUpWithConfirmSchema } from "@/validation/auth";

import {
  EyeClose,
  EyeOpen,
  Google,
  Loader,
  Lock,
  Mail,
  User,
} from "@/components/icons";

const SignUp = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as SignUpWithConfirmSchema,
    validators: {
      onSubmit: signUpWithConfirmSchema,
    },
    onSubmit: async ({ value }) => {
      await signUpMutation({
        name: value.name,
        email: value.email,
        password: value.password,
      });
    },
  });

  const {
    mutateAsync: signUpMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      // Invalidate user query to update navbar
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(
        "Account created! Please check your inbox to verify your email.",
        { duration: 5000 },
      );
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong!");
    },
  });

  const handleSocialSignup = async (provider: "google" | "github") => {
    await signInSocial(provider);
  };

  return (
    <div className="bg-background my-16 flex items-center justify-center px-4 sm:my-32">
      <div className="flex w-full flex-col items-center gap-4">
        <div className="text-center">
          {/* <h1 className="text-muted-foreground font-serif text-4xl">
            Ready to start?
          </h1> */}
          <h2 className="text-foreground font-serif text-3xl sm:text-5xl">
            Create your <span className="italic">account</span>.
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Only official BMSCE emails are
            allowed.
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
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
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <User />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="name"
                        type="text"
                        placeholder="Your Name"
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
                        value={field.state.value}
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

              <form.Field name="confirmPassword">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Lock />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isPending}
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? <EyeClose /> : <EyeOpen />}
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
                {isPending ? "Creating Account..." : "Sign Up"}
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
                onClick={() => handleSocialSignup("google")}
              >
                <Google />
                Google
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/auth/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
