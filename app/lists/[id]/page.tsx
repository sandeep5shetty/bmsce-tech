import { UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import Play from "@/components/icons/play";

import ListDetailActions from "@/features/lists/components/list-detail-actions";
import SearchAndFilter from "@/features/lists/components/search-and-filter";
import { getListDetails } from "@/features/lists/lib/actions";
import { formatDate } from "@/features/lists/lib/utils";
import ProjectsList from "@/features/projects/components/projects-list";

import { getUser } from "@/actions/user";

import { Calendar } from "@/components/icons";

const ListDetailPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const user = await getUser();

  const search = (resolvedSearchParams.search as string) || "";
  const sortBy = (resolvedSearchParams.sortBy as string) || "date";
  const sortDirection =
    (resolvedSearchParams.sortDir as "asc" | "desc") || "desc";
  const view = (resolvedSearchParams.view as "card" | "table") || "card";
  const filter =
    (resolvedSearchParams.filter as "reviewed" | "pending") || "reviewed";
  const page = parseInt((resolvedSearchParams.page as string) || "1", 10);

  const list = await getListDetails(id);

  const isOwner = list.userId === user?.id;

  return (
    <div className="container mx-auto mt-10 mb-32 max-w-6xl space-y-8 px-6">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Title and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-semibold tracking-wider sm:text-4xl">
                {list.name}
              </h1>
            </div>
            {list.description && (
              <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                {list.description}
              </p>
            )}

            {/* Creator Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={list.user.image || ""}
                  alt={list.user.name || "User"}
                />
                <AvatarFallback className="text-xs">
                  {list.user.name ? (
                    list.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  ) : (
                    <UserIcon className="h-3.5 w-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-sm">
                by {list.user.name || "Anonymous"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <ListDetailActions
            isOwner={isOwner}
            listId={list.id}
            listName={list.name}
            currentUserId={user?.id || null}
            listOwnerId={list.userId}
            search={search}
            sortBy={sortBy}
            sortDirection={sortDirection}
            filter={filter}
            currentPage={page}
          />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Playlist Link */}
          {list.playlistLink && (
            <Button variant={"secondary"} size={"icon"} asChild>
              <a
                href={list.playlistLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play />
              </a>
            </Button>
          )}

          {/* Divider */}
          {list.playlistLink && <div className="bg-border h-4 w-px" />}

          {/* Dates */}
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatDate(list.createdAt)}
            </span>
            {list.createdAt.getTime() !== list.updatedAt.getTime() && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1.5">
                  Updated {formatDate(list.updatedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <SearchAndFilter isOwner={isOwner} />
      {/* Client-side interactive content */}
      <ProjectsList
        listId={id}
        search={search}
        sortBy={sortBy}
        sortDirection={sortDirection}
        view={view}
        currentUserId={user?.id || null}
        filter={filter}
        page={page}
        isOwner={isOwner}
        listOwnerId={list.userId}
      />
    </div>
  );
};

export default ListDetailPage;
