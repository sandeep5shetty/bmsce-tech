"use client";

import {useEffect} from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { Loader } from "@/components/icons";

import { editList, getListDetails } from "../lib/actions";
import { List } from "../lib/types";
import { listSchema } from "../lib/validation";

interface EditListDialogProps {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListDialog({
  listId,
  open,
  onOpenChange,
}: EditListDialogProps) {
  const queryClient = useQueryClient();
  const id = listId;

  // Fetch list details when dialog opens
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ["list-details", id],
    queryFn: () => getListDetails(id!),
    enabled: !!id && open,
  });

  const listData = fetchedData;

  const form = useForm({
    defaultValues: {
      name: listData?.name || "",
      description: listData?.description || "",
      playlistLink: listData?.playlistLink || "",
    } as List,
    validators: {
      onSubmit: listSchema,
    },
    onSubmit: async () => {
      if (!id) return;
      await editListMutation({
        id,
        ...form.state.values,
      });
    },
  });

  const { mutateAsync: editListMutation, isPending } = useMutation({
    mutationFn: editList,
    onSuccess: () => {
      toast.success("List updated successfully!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list-details", id] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update list");
    },
  });

  // Reset form when listData changes
  useEffect(() => {
    if (listData && open) {
      form.setFieldValue("name", listData.name);
      form.setFieldValue("description", listData.description || "");
      form.setFieldValue("playlistLink", listData.playlistLink || "");
    }
  }, [listData, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={id}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit list</DialogTitle>
          <DialogDescription>
            Update your review list details.
          </DialogDescription>
        </DialogHeader>
        {isLoading && !listData ? (
          <div className="space-y-4">
            {/* Name field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* Description field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
            {/* Playlist link field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* Buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        ) : !listData ? null : (
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
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
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
                  <Label htmlFor="edit-description">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="edit-description"
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
                  <Label htmlFor="edit-playlistLink">
                    Playlist link{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="edit-playlistLink"
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
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
