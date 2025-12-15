"use client";

import { useState } from "react";

import Image from "next/image";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toggleProjectSave } from "@/features/projects/lib/actions";

import { CodeLink, Delete, Link as LinkIcon, Save } from "@/components/icons";

import { ProjectCardPreview } from "./project-card-preview";

interface ProjectCardProps {
  listProjectId: string;
  projectId: string;
  name: string;
  description: string;
  liveLink: string;
  codeLink: string | null;
  techStack: Array<{
    id: string;
    label: string;
    image: string | null;
  }>;
  review: {
    design: number;
    userExperience: number;
    creativity: number;
    functionality: number;
    hireability: number;
  } | null;

  userSaved: boolean;
  currentUserId: string | null;
  onClick: () => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export function ProjectCard({
  projectId,
  name,
  description,
  liveLink,
  codeLink,
  techStack,
  review,
  userSaved,
  currentUserId,
  onClick,
  onDelete,
}: ProjectCardProps) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(userSaved);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  const overallRating = review
    ? (review.design +
        review.userExperience +
        review.creativity +
        review.functionality +
        review.hireability) /
      5
    : null;

  const { mutate: toggleSave, isPending: isSaving } = useMutation({
    mutationFn: toggleProjectSave,
    onMutate: async () => {
      if (!currentUserId) {
        toast.error("Please log in to save projects");
        throw new Error("Not logged in");
      }

      // Optimistic update
      const previousSaved = saved;
      setSaved(!saved);

      return { previousSaved };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context) {
        setSaved(context.previousSaved);
      }
      if (error.message !== "Not logged in") {
        toast.error("Failed to update save");
      }
    },
    onSuccess: (data) => {
      toast.success(data.saved ? "Project saved!" : "Project unsaved");
      queryClient.invalidateQueries({ queryKey: ["list-projects"] });
    },
  });

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave({ projectId });
  };

  console.log(techStack);

  return (
    <>
      <article
        onClick={onClick}
        className="group bg-card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border"
      >
        {/* Project Preview */}
        {!review && <ProjectCardPreview liveLink={liveLink} />}

        <div className="relative flex flex-1 flex-col gap-3 p-4">
          {/* Header with Actions */}
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base leading-tight font-semibold tracking-tight">
                  {name}
                </h3>
              </div>
              {description && (
                <p className="text-muted-foreground line-clamp-2 flex-1 text-sm leading-snug">
                  {description}
                </p>
              )}
            </div>

            {currentUserId && (
              <div className="shrink0 flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => onDelete(e, projectId, name)}
                      className="text-destructive lg:text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-lg"
                    >
                      <Delete />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`h-8 w-8 ${saved ? "text-primary hover:text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-muted-foreground"}`}
                    >
                      <motion.div
                        animate={{ scale: saved ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Save
                          className={`h-3.5 w-3.5 ${saved && "fill-current"}`}
                        />
                      </motion.div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{saved ? "Unsave" : "Save"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {overallRating !== null && (
            <div className="bg-muted/30 flex justify-between rounded-lg border p-4">
              <p className="text-muted-foreground text-sm font-medium uppercase">
                Overall
              </p>
              <div className="bg-primary/10 text-primary flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold">
                <span>{overallRating.toFixed(1)}</span>
                <span className="text-[12px] opacity-70">/10</span>
              </div>
            </div>
          )}

          {/* Review Data */}
          {review && (
            <div className="bg-muted/30 rounded-lg border p-2.5">
              <div className="grid gap-x-3 gap-y-1.5">
                <ReviewItem label="Design" score={review.design} />
                <ReviewItem label="UX" score={review.userExperience} />
                <ReviewItem label="Creativity" score={review.creativity} />
                <ReviewItem
                  label="Functionality"
                  score={review.functionality}
                />
                <ReviewItem label="Hireability" score={review.hireability} />
              </div>
            </div>
          )}

          {/* Tech Stack - Expandable Icons */}
          {!review && techStack && techStack.length > 0 && (
            <div className="flex items-center">
              {techStack.slice(0, 5).map((tech) => {
                const isHovered = hoveredTech === tech.id;
                return (
                  <motion.div
                    key={tech.id}
                    className="bg-muted flex h-7 cursor-pointer items-center rounded-full border shadow-sm"
                    style={{
                      marginLeft: "-8px",
                      zIndex: isHovered ? 10 : 1,
                    }}
                    animate={{
                      width: isHovered ? "auto" : "28px",
                    }}
                    onMouseEnter={() => setHoveredTech(tech.id)}
                    onMouseLeave={() => setHoveredTech(null)}
                    layout
                    transition={{
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      {tech.image ? (
                        <Image
                          src={tech.image}
                          alt={tech.label}
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold">
                          {tech.label.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isHovered && (
                        <motion.span
                          className="overflow-hidden pr-2 text-xs font-medium"
                          initial={{
                            width: 0,
                            opacity: 0,
                            marginLeft: 0,
                          }}
                          animate={{
                            width: "auto",
                            opacity: 1,
                            marginLeft: "4px",
                          }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          transition={{
                            duration: 0.2,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                        >
                          <span className="whitespace-nowrap">
                            {tech.label}
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              {techStack.length > 5 && (
                <motion.div
                  className="bg-muted text-muted-foreground hover:bg-accent flex h-7 cursor-pointer items-center rounded-full border text-[10px] font-medium shadow-sm"
                  style={{
                    marginLeft: "-8px",
                    zIndex: hoveredTech === "more" ? 10 : 1,
                  }}
                  animate={{
                    width: hoveredTech === "more" ? "auto" : "28px",
                  }}
                  onMouseEnter={() => setHoveredTech("more")}
                  onMouseLeave={() => setHoveredTech(null)}
                  layout
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <span className="text-[10px] font-semibold">
                      +{techStack.length - 5}
                    </span>
                  </div>

                  <AnimatePresence>
                    {hoveredTech === "more" && (
                      <motion.span
                        className="overflow-hidden pr-2 text-xs font-medium"
                        initial={{
                          width: 0,
                          opacity: 0,
                          marginLeft: 0,
                        }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                          marginLeft: "4px",
                        }}
                        exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <span className="whitespace-nowrap">more</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}

          {/* Footer - Creator & Links */}
          <div className="mt-auto flex items-center justify-end gap-3 border-t pt-3">
            {/* External Links */}
            <div className="flex shrink-0 items-center gap-1">
              {codeLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={codeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon-lg"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <CodeLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>View Code</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {liveLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon-lg"
                        variant="ghost"
                        className="hover:text-foreground fill-accent"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>View Live</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

function ReviewItem({
  label,
  score,
  className = "",
}: {
  label: string;
  score: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <span className="text-muted-foreground w-16 shrink-0 text-xs font-medium">
        {label}
      </span>
      <div className="bg-primary/10 h-1.5 flex-1 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-primary h-full rounded-full"
        />
      </div>
      <span className="w-4 text-right text-xs font-semibold">{score}</span>
    </div>
  );
}
