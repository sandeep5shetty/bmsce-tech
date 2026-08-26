"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteExperience } from "../lib/actions";

export function DeleteExperienceButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExperience(id);
      toast.success("Experience deleted.");
      router.push("/experiences");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete experience",
      );
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={deleting}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this experience?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your writeup and all its rounds. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
