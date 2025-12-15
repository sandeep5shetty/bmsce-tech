"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { Delete } from "@/components/icons";
import { Error as ErrorIcon, Loader } from "@/components/icons";
import { List } from "@/types";

import { deleteList, getUserLists } from "../lib/actions";
import { CreateListCard } from "./create-list-card";
import { CreateListDialog } from "./create-list-dialog";
import { EditListDialog } from "./edit-list-dialog";
import { ListCard } from "./list-card";
import { ListsGridSkeleton } from "./lists-grid-skeleton";

export function ListsGrid() {
  const {
    data: lists,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lists"],
    queryFn: getUserLists,
  });
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [listToEditId, setListToEditId] = useState<string | null>(null);
  const [isManualRetrying, setIsManualRetrying] = useState(false);

  const { mutate: deleteListMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      toast.success("List deleted successfully!");
      setDeleteDialogOpen(false);
      setListToDelete(null);
      // Refetch lists after deletion
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete list",
      );
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setListToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!listToDelete) return;
    deleteListMutation({ id: listToDelete.id });
  };

  const handleEdit = (e: React.MouseEvent, list: List) => {
    e.preventDefault();
    e.stopPropagation();
    setListToEditId(list.id);
    setEditDialogOpen(true);
  };

  // Loading state - show skeleton on initial load or manual retry
  if ((isLoading && !lists) || isManualRetrying) {
    return <ListsGridSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ErrorIcon className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Failed to load lists</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : "An error occurred while fetching your lists."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={async () => {
              setIsManualRetrying(true);
              await refetch();
              setIsManualRetrying(false);
            }}
            variant="outline"
          >
            Try Again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  // Success state - show lists
  return (
    <>
      <CreateListDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      {listToEditId && (
        <EditListDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          listId={listToEditId}
        />
      )}
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateListCard
          onClick={() => {
            setCreateDialogOpen(true);
          }}
        />
        {lists &&
          lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif tracking-wider">
              Delete List
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                &quot;{listToDelete?.name}&quot;
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
                  <Loader className="h-4 w-4" />
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
    </>
  );
}
