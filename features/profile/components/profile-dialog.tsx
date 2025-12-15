"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useUploadThing } from "@/lib/upload";

import { updateUserProfile } from "@/actions/user";

import {
  Edit,
  Github,
  Globe,
  LinkedIn,
  Loader,
  NoImage,
  PeerList,
  X as Twitter,
} from "@/components/icons";
import { User } from "@/types";

import { EditProfile } from "../lib/types";
import { getInitials } from "../lib/utils";
import { editProfileSchema } from "../lib/validation";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
}: ProfileDialogProps) {
  const queryClient = useQueryClient();
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const { startUpload } = useUploadThing("profilePicUploader", {
    onUploadError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ value }: { value: EditProfile }) => {
      if (profilePicFile) {
        const res = await startUpload([profilePicFile]);
        value.image = res?.[0].ufsUrl;
      }

      await updateUserProfile(value);
    },
    onMutate: async ({ value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user"] });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<User>(["user"]);

      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData<User>(["user"], {
          ...previousUser,
          ...value,
        });
      }

      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    },
    onError: (err: Error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousUser) {
        queryClient.setQueryData(["user"], context.previousUser);
      }
      toast.error(err.message ?? "Failed to update profile");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const form = useForm({
    defaultValues: {
      name: user.name ?? "",
      bio: user.bio ?? "",
      image: user.image ?? "",
      github: user.github ?? "",
      twitter: user.twitter ?? "",
      linkedin: user.linkedin ?? "",
      peerlist: user.peerlist ?? "",
      portfolio: user.portfolio ?? "",
    } as EditProfile,
    validators: { onSubmit: editProfileSchema },
    onSubmit: async ({ value }) => {
      mutation.mutateAsync({ value });
    },
  });

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxSize: 4 * 1024 * 1024, // 4MB
    maxFiles: 1,
    disabled: mutation.isPending,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        form.setFieldValue("image", URL.createObjectURL(file));
        setProfilePicFile(file);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 4MB.");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Invalid file type. Please upload an image.");
      } else {
        toast.error("Failed to upload file.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and social links
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Avatar with Dropzone */}
          <form.Field name="image">
            {(field) => (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    {...getRootProps()}
                    className={`group relative cursor-pointer transition-all ${mutation.isPending && "cursor-not-allowed opacity-50"}`}
                  >
                    <input {...getInputProps()} />
                    <Avatar className="bg-muted h-20 w-20">
                      <AvatarImage
                        src={field.state.value || user.image || ""}
                        alt={user.name || "Profile pic"}
                      />
                      <AvatarFallback className="text-lg">
                        {user.name ? getInitials(user.name) : <NoImage />}
                      </AvatarFallback>
                    </Avatar>

                    {/* Pencil Icon Overlay */}
                    {!mutation.isPending && (
                      <div className="group-hover:bg-accent bg-muted absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200">
                        <Edit className="text-muted-foreground group-hover:text-accent-foreground h-3.5 w-3.5 transition-colors duration-200" />
                      </div>
                    )}

                    {/* Drag Active Highlight */}
                    {isDragActive && (
                      <div className="border-primary bg-primary/10 absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-muted-foreground text-xs">
                    Click or drag to upload (max 4MB)
                  </p>
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length ? (
                    <p className="text-destructive mt-1 text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </form.Field>

          {/* ---- Name ---- */}
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your name"
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]?.message}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          {/* ---- Bio ---- */}
          <form.Field name="bio">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Bio</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length ? (
                    <span className="text-destructive">
                      {field.state.meta.errors[0]?.message}
                    </span>
                  ) : null}
                  <span>{field.state.value.length}/500</span>
                </div>
              </div>
            )}
          </form.Field>

          {/* ---- Social Links (looped) ---- */}
          {(
            ["github", "twitter", "linkedin", "peerlist", "portfolio"] as const
          ).map((key) => {
            const Icon =
              key === "github"
                ? Github
                : key === "twitter"
                  ? Twitter
                  : key === "linkedin"
                    ? LinkedIn
                    : key === "peerlist"
                      ? PeerList
                      : Globe;

            const prefix =
              key === "github"
                ? "github.com/"
                : key === "twitter"
                  ? "x.com/"
                  : key === "linkedin"
                    ? "linkedin.com/in/"
                    : key === "peerlist"
                      ? "peerlist.io/"
                      : null;

            const placeholder =
              key === "github"
                ? "username"
                : key === "twitter"
                  ? "username"
                  : key === "linkedin"
                    ? "username"
                    : key === "peerlist"
                      ? "username"
                      : "https://rathore-abhishek.vercel.app";

            return (
              <form.Field key={key} name={key}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Icon className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      {prefix && (
                        <InputGroupAddon>
                          <InputGroupText>{prefix}</InputGroupText>
                        </InputGroupAddon>
                      )}
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={placeholder}
                        maxLength={key === "portfolio" ? 200 : 100}
                      />
                    </InputGroup>
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
            );
          })}

          {/* ---- Actions ---- */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader />}

              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
