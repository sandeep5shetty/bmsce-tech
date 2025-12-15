"use client";

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
import { Textarea } from "@/components/ui/textarea";

import { Loader } from "@/components/icons";

import { createList } from "../lib/actions";
import { List } from "../lib/types";
import { listSchema } from "../lib/validation";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateListDialog({
  open,
  onOpenChange,
}: CreateListDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      playlist: "",
    } as List,
    validators: {
      onSubmit: listSchema,
    },
    onSubmit: async () => {
      await createListMutation(form.state.values);
    },
  });

  const { mutateAsync: createListMutation, isPending } = useMutation({
    mutationFn: createList,
    onSuccess: () => {
      toast.success("List created successfully!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create list");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new list</DialogTitle>
          <DialogDescription>Add a new projects list.</DialogDescription>
        </DialogHeader>
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
                <Input
                  id="name"
                  placeholder="e.g. Frontend Projects"
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

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this review list..."
                  value={(field.state.value as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={isPending}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.value && (
                  <p className="text-muted-foreground text-xs">
                    {(field.state.value as string).length}/500 characters
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

          <form.Field name="playlistLink">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="playlistLink">
                  Playlist link{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="playlistLink"
                  placeholder="https://youtube.com/playlist?list=..."
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader className="h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create list"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
