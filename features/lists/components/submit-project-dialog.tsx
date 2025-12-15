"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";

import { submitProjectToList } from "@/features/lists/lib/actions";
import { TechStackInput } from "@/features/projects/components/tech-stack-input";
import { submitProject } from "@/features/projects/lib/actions";
import { NewProject } from "@/features/projects/lib/types";
import { newProjectWithoutTechStackSchema } from "@/features/projects/lib/validation";

import { Loader } from "@/components/icons";

interface SubmitProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
}

export function SubmitProjectDialog({
  open,
  onOpenChange,
  listId,
  listName,
}: SubmitProjectDialogProps) {
  const queryClient = useQueryClient();
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
    } as Omit<NewProject, "techStack" | "visibility">,
    validators: { onSubmit: newProjectWithoutTechStackSchema },
    onSubmit: async () => {
      console.log("hi");
      const projectData = {
        ...form.state.values,
        techStack,
      };

      console.log("projectData", projectData);
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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Project</DialogTitle>
          <DialogDescription>
            Submit a new project to &quot;{listName}&quot;
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted, current values:", form.state.values);
            console.log("Form errors:", form.state.errors);
            console.log("Can submit:", form.state.canSubmit);
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Name */}
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
          {/* Description */}
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
          {/* Body */}
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
          {/* Links */}
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

          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-1/2"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="w-1/2">
              {isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
