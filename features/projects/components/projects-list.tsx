"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ListProjectDetailModal,
  ProjectCard,
} from "@/features/lists/components";
import { getListProjects } from "@/features/lists/lib/actions";
import {
  deleteProject,
  getRandomListProject,
} from "@/features/projects/lib/actions";

import {
  Delete,
  Error as ErrorIcon,
  FolderCode,
  Loader,
} from "@/components/icons";

import ProjectsTable, { ProjectsTableSkeleton } from "./projects-table";

interface ProjectsListProps {
  listId: string;
  search: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
  view: "card" | "table";
  currentUserId: string | null;
  filter: "reviewed" | "pending";
  page?: number;
  isOwner?: boolean;
  listOwnerId: string;
}

const ProjectsList = ({
  listId,
  search,
  sortBy,
  sortDirection,
  view,
  currentUserId,
  filter,
  page: initialPage,
  isOwner = false,
  listOwnerId,
}: ProjectsListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedListProjectId, setSelectedListProjectId] = useState<
    string | null
  >(null);
  const [selectedProjectSaved, setSelectedProjectSaved] = useState(false);
  const [isPickingRandom, setIsPickingRandom] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Get current page from URL or default to 1
  const currentPage = initialPage || 1;

  // Fetch projects with pagination
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: [
      "list-projects",
      listId,
      search,
      sortBy,
      sortDirection,
      filter,
      currentPage,
    ],
    queryFn: () =>
      getListProjects({
        listId,
        search: search || undefined,
        page: currentPage,
        limit: 12,
        sortBy: sortBy as "date" | "rating",
        sortDirection,
        filter,
      }),
  });

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

  const projects = projectsData?.projects ?? [];
  const totalPages = projectsData?.totalPages ?? 0;

  const handleProjectClick = (
    projectId: string,
    listProjectId: string,
    userSaved: boolean,
  ) => {
    setSelectedProjectId(projectId);
    setSelectedListProjectId(listProjectId);
    setSelectedProjectSaved(userSaved);
    setDetailModalOpen(true);
  };

  const handlePickRandom = async () => {
    setIsPickingRandom(true);
    try {
      const randomProject = await getRandomListProject(listId);

      if (!randomProject) {
        toast.error("No not-reviewed projects found in this list");
        return;
      }

      setSelectedProjectId(randomProject.project.id);

      setSelectedListProjectId(randomProject.id);

      setSelectedProjectSaved(false); // Default to false for new random project
      setDetailModalOpen(true);
    } catch (error) {
      console.error("Error picking random project:", error);
      toast.error("Failed to pick a random project");
    } finally {
      setIsPickingRandom(false);
    }
  };

  // Helper to create URL with updated page parameter
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page), { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Loading state
  if (isProjectsLoading && !projectsData) {
    if (view === "table") {
      return <ProjectsTableSkeleton filter={filter} />;
    }

    // Different skeleton for reviewed vs pending
    if (filter === "pending") {
      // Pending projects - simpler skeleton (no ratings)
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border p-4"
            >
              <div className="relative flex flex-1 flex-col gap-3">
                {/* Header with Actions */}
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-6 w-3/5" />
                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </div>

                {/* Tech Stack Icons */}
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>

                {/* Footer - Links */}
                <div className="mt-auto flex items-center justify-end gap-1 border-t pt-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Reviewed projects - full skeleton (with preview and ratings)
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card flex flex-col overflow-hidden rounded-xl border"
          >
            <div className="space-y-4 p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-7 w-3/5" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>

              {/* Rating Bars */}
              <Skeleton className="bg-muted/30 space-y-2 rounded-lg border p-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 shrink-0 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 shrink-0 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>{" "}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 shrink-0 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>{" "}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 shrink-0 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>{" "}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 shrink-0 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </Skeleton>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isProjectsError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ErrorIcon className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Failed to load projects</EmptyTitle>
          <EmptyDescription>
            {projectsError?.message || "Something went wrong"}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => refetchProjects()}>
          Try Again
        </Button>
      </Empty>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCode className="text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>
            {search ? "No projects found" : "No projects yet"}
          </EmptyTitle>
          <EmptyDescription>
            {search
              ? "Try adjusting your search terms"
              : "Be the first to submit a project to this list"}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      {/* Card View */}
      {view === "card" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((lp) => (
              <ProjectCard
                key={lp.id}
                listProjectId={lp.id}
                projectId={lp.project.id}
                name={lp.project.name}
                description={lp.project.description}
                liveLink={lp.project.liveLink}
                codeLink={lp.project.codeLink}
                techStack={lp.project.techStack}
                review={lp.project.review}
                userSaved={lp.userSaved}
                currentUserId={currentUserId}
                onClick={() =>
                  handleProjectClick(lp.project.id, lp.id, lp.userSaved)
                }
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        currentPage > 1 ? createPageUrl(currentPage - 1) : "#"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={createPageUrl(page)}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={
                        currentPage < totalPages
                          ? createPageUrl(currentPage + 1)
                          : "#"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <>
          <ProjectsTable
            projects={projects}
            onProjectClick={handleProjectClick}
            filter={filter}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onDelete={handleDeleteClick}
          />

          {/* Pagination for table view */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        currentPage > 1 ? createPageUrl(currentPage - 1) : "#"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={createPageUrl(page)}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={
                        currentPage < totalPages
                          ? createPageUrl(currentPage + 1)
                          : "#"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
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
      {/* Detail Modal */}
      <ListProjectDetailModal
        projectId={selectedProjectId}
        listProjectId={selectedListProjectId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        currentUserId={currentUserId}
        initialSaved={selectedProjectSaved}
        isOwner={isOwner}
        listOwnerId={listOwnerId}
        onPickAnother={handlePickRandom}
        onDelete={handleDeleteClick}
      />
    </>
  );
};

export default ProjectsList;
