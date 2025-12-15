"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";

import { submitProjectToList } from "@/features/lists/lib/actions";
import { TechStackInput } from "@/features/projects/components/tech-stack-input";
import { submitProject } from "@/features/projects/lib/actions";
import { NewProject } from "@/features/projects/lib/types";
import { newProjectWithoutTechStackSchema } from "@/features/projects/lib/validation";

import { Loader, Tick } from "@/components/icons";

export default function SubmitProjectPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listId = params.id as string;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [techStack, setTechStack] = useState<
    { label: string; image?: string }[]
  >([]);
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      body: "",
      liveLink: "",
      codeLink: "",
      visibility: "PUBLIC" as const,
    } as Omit<NewProject, "techStack">,
    validators: { onSubmit: newProjectWithoutTechStackSchema },
    onSubmit: async () => {
      const projectData = {
        ...form.state.values,
        techStack: [],
      };

      // Validate using the schema that allows empty tech stack if we were using it,
      // but here we use the one without tech stack for form validation
      // and manually construct the object for the action.

      await createAndSubmitMutation(projectData);
    },
  });

  const { mutateAsync: createAndSubmitMutation, isPending } = useMutation({
    mutationFn: async (data: NewProject) => {
      // 1. Create the project
      const newProject = await submitProject(data);

      if (!newProject) {
        throw new Error("Failed to create project");
      }

      // 2. Submit to list
      await submitProjectToList({
        listId,
        projectId: newProject.id,
      });

      return newProject;
    },
    onSuccess: () => {
      toast.success("Project submitted successfully!");
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["lists", listId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit project");
    },
  });

  const addTech = (tech: { label: string; image?: string }) => {
    setTechStack([...techStack, tech]);
  };

  const removeTech = (index: number) => {
    setTechStack(techStack.filter((_, i) => i !== index));
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-4xl">
          <Tick className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-wider">
            Project Submitted!
          </h1>
          <p className="text-muted-foreground max-w-sm text-lg text-pretty">
            Your project has been successfully created and added to the list.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setIsSubmitted(false)}>
            Submit Another
          </Button>
          <Button asChild>
            <Link href={`/lists/${listId}`}>Go to List</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-10">
      <div className="mb-4 flex flex-col items-center justify-center text-center lg:mb-8">
        <Image
          src="/bmsce.svg"
          alt="Rocket"
          width={50}
          height={50}
          className="mb-4 w-12 object-contain lg:w-14"
        />
        <h1 className="text-muted-foreground font-serif text-3xl tracking-wider lg:text-4xl">
          Submit <span className="italic">&</span> Shine
        </h1>
        <p className="font-serif text-4xl tracking-wider text-pretty lg:text-5xl">
          Get <span className="italic">Featured</span> Now.
        </p>
      </div>

      <Card className="w-full max-w-xl">
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. My Awesome App"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                    maxLength={100}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your project..."
                    value={(field.state.value as string) || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    disabled={isPending}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.value && (
                    <p className="text-muted-foreground text-xs">
                      {(field.state.value as string).length}/1000 characters
                    </p>
                  )}
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="body">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="body">
                    Content{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="min-h-[200px]">
                    <RichTextEditor
                      value={(field.state.value as string) || ""}
                      onChange={(value) => field.handleChange(value)}
                      disabled={isPending}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="grid gap-6 md:grid-cols-2">
              <form.Field name="liveLink">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="liveLink">Live URL</Label>
                    <Input
                      id="liveLink"
                      type="url"
                      placeholder="https://example.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isPending}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="codeLink">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="codeLink">
                      Code URL{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="codeLink"
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={(field.state.value as string) || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isPending}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Tech Stack */}
            <TechStackInput
              techStack={techStack}
              onAdd={addTech}
              onRemove={removeTech}
              disabled={isPending}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
