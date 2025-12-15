"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { JSONContent, generateHTML } from "@tiptap/core";
import { FontFamily } from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Slider } from "@/components/ui/slider";

import Shuffle from "@/components/icons/shuffle";

import { submitReview } from "../lib/actions";
import { reviewSchema } from "../lib/validation";

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ProjectReviewFormProps {
  projectId: string;
  onSuccess?: () => void;
  initialData?: {
    design: number;
    userExperience: number;
    creativity: number;
    functionality: number;
    hireability: number;
    remark: string | null;
  } | null;
  readOnly?: boolean;
  isOwner?: boolean;
  onPickAnother?: () => void;
}

export function ProjectReviewForm({
  projectId,
  onSuccess,
  initialData,
  readOnly: readOnlyProp,
  isOwner = false,
  onPickAnother,
}: ProjectReviewFormProps) {
  const readOnly = readOnlyProp ?? !isOwner;
  const { mutateAsync: submitReviewMutation, isPending } = useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const form = useForm({
    defaultValues: {
      projectId,
      design: initialData?.design ?? 5,
      userExperience: initialData?.userExperience ?? 5,
      creativity: initialData?.creativity ?? 5,
      functionality: initialData?.functionality ?? 5,
      hireability: initialData?.hireability ?? 5,
      remark: initialData?.remark ?? "",
    } as ReviewFormValues,
    validators: {
      onChange: reviewSchema,
    },
    onSubmit: async ({ value }) => {
      if (readOnly) return;
      await submitReviewMutation(value);
    },
  });

  const ratingCategories = [
    { name: "design", label: "Design and Aesthetics" },
    { name: "userExperience", label: "User Experience" },
    { name: "creativity", label: "Creativity and Innovation" },
    { name: "functionality", label: "Functionality and Execution Quality" },
    { name: "hireability", label: "Hireability" },
  ] as const;

  return (
    <div className="flex w-full flex-col py-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!readOnly) {
            form.handleSubmit();
          }
        }}
        className="flex w-full flex-col gap-6"
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Overall Rating Display */}
          <form.Subscribe
            selector={(state) => [
              state.values.design,
              state.values.userExperience,
              state.values.creativity,
              state.values.functionality,
              state.values.hireability,
            ]}
          >
            {([
              design,
              userExperience,
              creativity,
              functionality,
              hireability,
            ]) => {
              const overall =
                (design +
                  userExperience +
                  creativity +
                  functionality +
                  hireability) /
                5;
              return (
                <div className="bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
                  <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                    Overall Rating
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-5xl font-bold">
                      {overall.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-xl">/ 10</span>
                  </div>
                </div>
              );
            }}
          </form.Subscribe>

          <div className="space-y-6">
            {ratingCategories.map((category) => (
              <form.Field key={category.name} name={category.name}>
                {(field) => (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {category.label}
                      </Label>
                      <span className="text-muted-foreground font-mono text-sm font-medium">
                        {field.state.value} / 10
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[field.state.value]}
                      onValueChange={(vals) => field.handleChange(vals[0])}
                      className="py-1"
                      disabled={isPending || readOnly}
                    />
                  </div>
                )}
              </form.Field>
            ))}

            <form.Field name="remark">
              {(field) => {
                // Parse and convert remark to HTML for readonly display
                const getRemarkHTML = () => {
                  if (!field.state.value) return null;

                  try {
                    const content =
                      typeof field.state.value === "string"
                        ? JSON.parse(field.state.value)
                        : field.state.value;

                    return generateHTML(content as JSONContent, [
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
                    ]);
                  } catch {
                    // Fallback to plain string if parsing fails
                    return field.state.value;
                  }
                };

                return (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Remarks{" "}
                      <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    {readOnly && field.state.value ? (
                      <div
                        className="prose dark:prose-invert prose-sm min-h-[120px] max-w-none rounded-md text-sm"
                        dangerouslySetInnerHTML={{
                          __html: getRemarkHTML() || "",
                        }}
                      />
                    ) : readOnly ? (
                      <div className="text-muted-foreground bg-muted/30 min-h-[120px] rounded-md border p-3 text-sm italic">
                        No remarks provided.
                      </div>
                    ) : (
                      <RichTextEditor
                        value={field.state.value ?? ""}
                        onChange={field.handleChange}
                        placeholder="Add your detailed review here..."
                        disabled={isPending}
                      />
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>
        </div>

        {isOwner && (
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant={"outline"}
              className="flex-1"
              disabled={isPending}
              onClick={onPickAnother}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Shuffle />}
              Pick Another
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
