"use client";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import Shuffle from "@/components/icons/shuffle";

import { ListProjectDetailModal } from "@/features/projects/components/project-detail-modal";
import {
  deleteProject,
  getRandomListProject,
} from "@/features/projects/lib/actions";

import { Delete, Edit, Loader, Plus } from "@/components/icons";

import { EditListDialog } from "./edit-list-dialog";
import { SubmitProjectDialog } from "./submit-project-dialog";

const ListDetailActions = ({
  listId,
  listName,
  isOwner,
  currentUserId,
  listOwnerId,
  search,
  sortBy,
  sortDirection,
  filter,
  currentPage,
}: {
  isOwner: boolean;
  listId: string;
  listName: string;
  currentUserId: string | null;
  listOwnerId: string;
  search: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
  filter: "reviewed" | "pending";
  currentPage: number;
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { mutate: deleteProjectMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success("Project deleted successfully!");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      // Refetch lists after deletion
      queryClient.invalidateQueries({
        queryKey: [
          "list-projects",
          listId,
          search,
          sortBy,
          sortDirection,
          filter,
          currentPage,
        ],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    },
  });

  const { mutate: pickRandomProject, isPending: isPickingRandom } = useMutation(
    {
      mutationFn: async () => {
        const randomProject = await getRandomListProject(listId);
        if (!randomProject) {
          throw new Error("No not-reviewed projects found in this list");
        }
        return randomProject;
      },
      onSuccess: (randomProject) => {
        setSelectedProjectId(randomProject.project.id);
        setProjectModalOpen(true);
      },
      onError: (error) => {
        console.error("Error picking random project:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to pick a random project",
        );
      },
    },
  );

  const handlePickRandom = () => {
    pickRandomProject();
  };

  const confirmDelete = () => {
    if (!projectToDelete) return;
    deleteProjectMutation(projectToDelete.id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="flex shrink-0 gap-2">
        {isOwner && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit />
          </Button>
        )}
        <Button
          size="default"
          variant={isOwner ? "secondary" : "default"}
          onClick={() => setSubmitDialogOpen(true)}
        >
          <Plus />
          Submit Project
        </Button>
        {isOwner && (
          <Button
            size="default"
            onClick={handlePickRandom}
            disabled={isPickingRandom}
          >
            {isPickingRandom ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Shuffle />
            )}
            {isPickingRandom ? "Picking..." : "Pick Random"}
          </Button>
        )}
      </div>

      {isOwner && (
        <AlertDialog open={deleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif tracking-wider">
                Delete List
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  &quot;{projectToDelete?.name}&quot;
                </span>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Delete />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isOwner && (
        <EditListDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          listId={listId}
        />
      )}
      <SubmitProjectDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        listId={listId}
        listName={listName}
      />
      <ListProjectDetailModal
        projectId={selectedProjectId}
        listProjectId={null}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        currentUserId={currentUserId}
        initialSaved={false}
        isOwner={isOwner}
        onPickAnother={handlePickRandom}
        listOwnerId={listOwnerId}
        onDelete={handleDeleteClick}
      />
    </>
  );
};

export default ListDetailActions;
