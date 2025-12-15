"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toggleProjectSave } from "@/features/projects/lib/actions";

import { CodeLink, Delete, Link as LinkIcon, Save } from "@/components/icons";

interface Project {
  id: string;
  project: {
    id: string;
    name: string;
    description: string;
    liveLink: string;
    codeLink?: string | null;
    techStack: { label: string; image?: string | null; id?: string }[];
    review: {
      design: number;
      userExperience: number;
      creativity: number;
      functionality: number;
      hireability: number;
    } | null;
  };
  userSaved: boolean;
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick: (
    projectId: string,
    listProjectId: string,
    userSaved: boolean,
  ) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  filter?: "reviewed" | "pending";
  currentUserId?: string | null;
  isOwner?: boolean;
}

// Tech Stack Cell Component for Pending Projects
function TechStackCell({
  techStack,
}: {
  techStack: Project["project"]["techStack"];
}) {
  return (
    <div className="flex items-center">
      {techStack.slice(0, 5).map((tech, idx) => {
        const techId = tech.id || `tech-${idx}`;
        return (
          <TooltipProvider key={techId}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div
                  className="bg-muted hover:bg-muted/80 relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors hover:z-10"
                  style={{
                    marginLeft: idx === 0 ? "0" : "-8px",
                  }}
                >
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
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tech.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {techStack.length > 5 && (
        <div
          className="bg-muted hover:bg-muted/80 text-muted-foreground relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[10px] font-semibold shadow-sm transition-colors hover:z-10"
          style={{
            marginLeft: "-8px",
          }}
        >
          +{techStack.length - 5}
        </div>
      )}
    </div>
  );
}

// Actions Cell Component
function ActionsCell({
  project,
  currentUserId,
  isOwner,
  onDelete,
}: {
  project: Project;
  currentUserId?: string | null;
  isOwner?: boolean;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(project.userSaved);

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
    onError: (error, variables, context) => {
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
    toggleSave({ projectId: project.project.id });
  };

  console.log(typeof onDelete);

  return (
    <div className="flex justify-center gap-1.5">
      {isOwner && (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={(e) =>
                  onDelete(e, project.project.id, project.project.name)
                }
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Delete className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Delete Project</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {currentUserId && (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSave}
                disabled={isSaving}
                className={`${saved ? "text-primary hover:text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-muted-foreground"}`}
              >
                <Save className={`h-4 w-4 ${saved && "fill-current"}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{saved ? "Unsave" : "Save"} Project</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

const ProjectsTable = ({
  projects,
  onProjectClick,
  filter = "reviewed",
  currentUserId,
  isOwner = false,
  onDelete,
}: ProjectsTableProps) => {
  console.log(onDelete);
  // Reviewed projects columns
  const reviewedColumns: ColumnDef<Project>[] = [
    {
      accessorKey: "project.name",
      header: () => <div className="text-start">Project</div>,
      size: 80,
      cell: ({ row }) => {
        const name = row.original.project.name;
        const description = row.original.project.description;

        return (
          <div className="flex max-w-40 flex-col gap-1.5">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <h3 className="w-fit truncate text-sm font-semibold">
                    {name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-sm font-semibold">{name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <p className="text-muted-foreground line-clamp-2 truncate text-xs leading-relaxed">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-sm font-medium">
                  {description}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: "project.review.overall",
      header: () => <div className="text-center">Overall</div>,
      size: 80,
      cell: ({ row }) => {
        const review = row.original.project.review;

        if (!review) {
          return (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground text-center text-xs">
                    -
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Not reviewed yet</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        const overallRating = (
          (review.design +
            review.userExperience +
            review.creativity +
            review.functionality +
            review.hireability) /
          5
        ).toFixed(1);

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold">
                    <span>{overallRating}</span>
                    <span className="text-[10px] opacity-70">/10</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Overall Rating: {overallRating}/10</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "project.review.design",
      header: () => <div className="text-center">Design</div>,
      size: 70,
      cell: ({ row }) => {
        const review = row.original.project.review;
        if (!review)
          return (
            <div className="text-muted-foreground text-center text-xs">-</div>
          );

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-semibold transition-colors">
                    {review.design}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Design: {review.design}/10</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "project.review.userExperience",
      header: () => <div className="text-center">UX</div>,
      size: 70,
      cell: ({ row }) => {
        const review = row.original.project.review;
        if (!review)
          return (
            <div className="text-muted-foreground text-center text-xs">-</div>
          );

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-semibold transition-colors">
                    {review.userExperience}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  User Experience: {review.userExperience}/10
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "project.review.creativity",
      header: () => <div className="text-center">Creative</div>,
      size: 70,
      cell: ({ row }) => {
        const review = row.original.project.review;
        if (!review)
          return (
            <div className="text-muted-foreground text-center text-xs">-</div>
          );

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-semibold transition-colors">
                    {review.creativity}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Creativity: {review.creativity}/10</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "project.review.functionality",
      header: () => <div className="text-center">Function</div>,
      size: 70,
      cell: ({ row }) => {
        const review = row.original.project.review;
        if (!review)
          return (
            <div className="text-muted-foreground text-center text-xs">-</div>
          );

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-semibold transition-colors">
                    {review.functionality}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  Functionality: {review.functionality}/10
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "project.review.hireability",
      header: () => <div className="text-center">Hire</div>,
      size: 70,
      cell: ({ row }) => {
        const review = row.original.project.review;
        if (!review)
          return (
            <div className="text-muted-foreground text-center text-xs">-</div>
          );

        return (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-semibold transition-colors">
                    {review.hireability}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Hireability: {review.hireability}/10</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "links",
      header: () => <div className="text-center">Links</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1.5">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link
                    href={row.original.project.liveLink}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">View Live Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {row.original.project.codeLink && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    className="hover:bg-primary/10"
                  >
                    <Link
                      href={row.original.project.codeLink}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CodeLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">View Source Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
  ];

  // Pending projects columns
  const pendingColumns: ColumnDef<Project>[] = [
    {
      accessorKey: "project.name",
      header: "Project",
      size: 250,
      cell: ({ row }) => {
        const name = row.original.project.name;
        const description = row.original.project.description;

        return (
          <div className="flex w-52 flex-col gap-1.5">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <h3 className="truncate text-sm font-semibold">{name}</h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-sm font-semibold">{name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {description}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: "project.techStack",
      header: "Tech Stack",
      size: 300,
      cell: ({ row }) => (
        <TechStackCell techStack={row.original.project.techStack} />
      ),
    },
    {
      id: "links",
      header: () => <div className="text-center">Links</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1.5">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link
                    href={row.original.project.liveLink}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">View Live Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {row.original.project.codeLink && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={row.original.project.codeLink}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CodeLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">View Source Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
  ];

  // Add actions column if user is authenticated
  if (currentUserId) {
    const actionsColumn: ColumnDef<Project> = {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      size: 100,
      cell: ({ row }) => (
        <ActionsCell
          project={row.original}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onDelete={onDelete}
        />
      ),
    };

    if (filter === "pending") {
      pendingColumns.push(actionsColumn);
    } else {
      reviewedColumns.push(actionsColumn);
    }
  }

  const columns = filter === "pending" ? pendingColumns : reviewedColumns;

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="w-fit text-xs font-semibold tracking-wide uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() =>
                    onProjectClick(
                      row.original.project.id,
                      row.original.id,
                      row.original.userSaved,
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="text-muted-foreground">
                    <p className="text-sm font-medium">No projects found</p>
                    <p className="mt-1 text-xs">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export function ProjectsTableSkeleton({
  filter = "reviewed",
  rowCount = 5,
}: {
  filter?: "reviewed" | "pending";
  rowCount?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px] text-xs font-semibold tracking-wide uppercase">
                Project
              </TableHead>
              {filter === "reviewed" ? (
                <>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    Overall
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    Design
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    UX
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    Creative
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    Function
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                    Hire
                  </TableHead>
                </>
              ) : (
                <TableHead className="w-[300px] text-xs font-semibold tracking-wide uppercase">
                  Tech Stack
                </TableHead>
              )}
              <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                Links
              </TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="py-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </TableCell>
                {filter === "reviewed" ? (
                  <>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-12 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-8 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-8 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-8 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-8 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-6 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <TableCell className="py-4">
                    <div className="flex items-center">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton
                          key={j}
                          className="ring-background h-7 w-7 rounded-full border ring-2"
                          style={{ marginLeft: j === 0 ? 0 : -8 }}
                        />
                      ))}
                    </div>
                  </TableCell>
                )}
                <TableCell className="py-4">
                  <div className="flex justify-center gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-center gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ProjectsTable;
