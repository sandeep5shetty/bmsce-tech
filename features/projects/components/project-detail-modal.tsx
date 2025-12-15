"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Content } from "@tiptap/core";
import { FontFamily } from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Save from "@/components/icons/save";

import { PlatformPreview } from "@/features/projects/components/platform-preview";
import { ProjectReviewForm } from "@/features/projects/components/project-review-form";
import {
  getProjectDetails,
  toggleProjectSave,
} from "@/features/projects/lib/actions";

import { formatDate } from "@/lib/utils";

import {
  Calendar,
  CodeLink,
  Delete,
  Error as ErrorIcon,
  Link as LinkIcon,
} from "@/components/icons";

interface ListProjectDetailModalProps {
  projectId: string | null;
  listProjectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
  initialSaved?: boolean;
  isOwner?: boolean;
  listOwnerId: string;
  onPickAnother: () => void;
  onDelete?: (e: React.MouseEvent, id: string, name: string) => void;
}

export function ListProjectDetailModal({
  projectId,
  open,
  onOpenChange,
  currentUserId,
  initialSaved = false,
  isOwner = false,
  onPickAnother,
  listOwnerId,
  onDelete,
}: ListProjectDetailModalProps) {
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project-details", projectId, listOwnerId],
    queryFn: () => getProjectDetails(projectId!, listOwnerId),
    enabled: !!projectId && open,
  });

  const [saved, setSaved] = useState(initialSaved);

  const bodyContent = project?.body
    ? typeof project.body === "string"
      ? (JSON.parse(project.body) as Content)
      : (project.body as Content)
    : undefined;

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class:
            "text-primary underline underline-offset-2 hover:text-primary cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    immediatelyRender: false,
  });

  // Update editor content when bodyContent changes
  useEffect(() => {
    if (editor && bodyContent) {
      editor.commands.setContent(bodyContent);
    }
  }, [editor, bodyContent]);

  const { mutate: toggleSave, isPending: isSaving } = useMutation({
    mutationFn: toggleProjectSave,
    onMutate: async () => {
      if (!currentUserId) {
        toast.error("Please log in to save projects");
        throw new Error("Not logged in");
      }

      const previousSaved = saved;
      setSaved(!saved);
      return { previousSaved };
    },
    onError: (error, _variables, context) => {
      if (context) {
        setSaved(context.previousSaved);
      }
      if (error.message !== "Not logged in") {
        toast.error("Failed to update save");
      }
    },
    onSuccess: (data) => {
      toast.success(data.saved ? "Project saved!" : "Project unsaved");
      queryClient.invalidateQueries({ queryKey: ["project-details"] });
      queryClient.invalidateQueries({ queryKey: ["list-projects"] });
    },
  });

  const handleSave = () => {
    if (projectId) {
      toggleSave({ projectId });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-full w-full max-w-5xl flex-row">
          {/* Left Column Skeleton - Project Details */}
          <div className="scrollbar-hide flex max-h-screen w-1/2 flex-col overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">Loading project...</DialogTitle>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-5/6" />
            </DialogHeader>

            <div className="mt-1 mb-4 space-y-5">
              {/* Actions */}
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
                <div className="bg-border mx-2 h-6 w-px" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>

              {/* Creator & Date */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3 w-32" />
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>

            {/* Platform Preview Skeleton */}
            <div className="w-full space-y-3">
              <div className="grid w-full grid-cols-3 gap-1">
                <Skeleton className="h-9 rounded-md" />
                <Skeleton className="h-9 rounded-md" />
                <Skeleton className="h-9 rounded-md" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="aspect-2/1 w-full rounded-xl" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            {/* Body Skeleton */}
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          <div className="via-border mx-5 h-full w-px bg-linear-to-b from-transparent to-transparent" />

          {/* Right Column Skeleton - Review Form */}
          <div className="scrollbar-hide mt-4 flex max-h-screen w-1/2 flex-col overflow-y-auto">
            <div className="flex w-full flex-col gap-6 py-6">
              {/* Overall Rating Skeleton */}
              <div className="bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-baseline gap-1">
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>

              {/* Sliders Skeleton */}
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-5 w-full rounded-full" />
                  </div>
                ))}

                {/* Remarks Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-[120px] w-full rounded-md" />
                </div>
              </div>

              {/* Buttons Skeleton */}
              <div className="flex w-full gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">Error loading project</DialogTitle>
          <div className="flex flex-col items-center justify-center py-12">
            <ErrorIcon className="text-destructive mb-4 h-8 w-8" />
            <p className="text-muted-foreground mb-4 text-sm">
              {error?.message || "Failed to load project"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full w-full max-w-5xl flex-row">
        <div className="scrollbar-hide flex max-h-screen w-1/2 flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl leading-tight tracking-wider">
              {project.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-start text-sm leading-relaxed">
              {project.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 mb-4 space-y-5">
            {/* Action Buttons with Like & Save */}
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <a
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Live Demo
                </a>
              </Button>
              {project.codeLink && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={project.codeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CodeLink className="h-3.5 w-3.5" />
                    Code
                  </a>
                </Button>
              )}
              <div className="bg-border mx-2 h-6 w-px" />

              {currentUserId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSave}
                      disabled={isSaving}
                      className={
                        saved
                          ? "text-primary hover:text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      <Save className={saved ? "fill-current" : ""} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{saved ? "Unsave" : "Save"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {currentUserId && isOwner && onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => onDelete(e, project.id, project.name)}
                      className="text-destructive lg:text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-lg"
                    >
                      <Delete />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Creator & Date */}
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">
                Submitted {formatDate(project.createdAt)}
              </span>
            </div>

            {/* Tech Stack */}
            {project.techStack && project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <div
                    key={tech.id}
                    className="bg-muted/30 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5"
                  >
                    {tech.image && (
                      <Image
                        src={tech.image}
                        alt={tech.label}
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    )}
                    <span className="text-xs font-medium">{tech.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform Previews */}
          {project && <PlatformPreview liveLink={project.liveLink} />}

          {/* Rich Content */}
          {bodyContent && editor && (
            <div className="prose dark:prose-invert prose-sm scrollbar-hide max-w-none text-sm">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
        <div className="via-border mx-5 h-full w-px bg-linear-to-b from-transparent to-transparent" />
        <div className="scrollbar-hide mt-4 flex max-h-screen w-1/2 flex-col overflow-y-auto">
          {project && (
            <ProjectReviewForm
              projectId={project.id}
              onSuccess={() => onOpenChange(false)}
              isOwner={isOwner}
              onPickAnother={onPickAnother}
              initialData={
                project.review
                  ? {
                      design: project.review.design,
                      userExperience: project.review.userExperience,
                      creativity: project.review.creativity,
                      functionality: project.review.functionality,
                      hireability: project.review.hireability,
                      remark:
                        typeof project.review.remark === "string"
                          ? project.review.remark
                          : project.review.remark
                            ? JSON.stringify(project.review.remark)
                            : null,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
