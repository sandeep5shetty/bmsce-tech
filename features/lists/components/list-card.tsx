"use client";

import { useState } from "react";

import { useRouter } from "@bprogress/next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import CopyShare from "@/components/icons/copy-share";
import Play from "@/components/icons/play";

import { Calendar, Delete, Edit, Tick } from "@/components/icons";
import { List } from "@/types";

import { formatDate } from "../lib/utils";

interface ListCardProps {
  list: List;
  onEdit: (e: React.MouseEvent, list: List) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
    const url = `${window.location.origin}/lists/${list.id}`;
    navigator.clipboard.writeText(url);
  };

  const handleOpenVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(list?.playlistLink ?? "#", "_blank");
  };

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/lists/${list.id}`);
      }}
      className="group bg-card hover:shadow-primary/5 relative flex cursor-pointer flex-col overflow-hidden rounded-xl border"
    >
      {/* Gradient overlay on hover */}
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col gap-4 p-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg leading-tight font-semibold tracking-tight transition-colors">
                  {list.name}
                </h3>
              </div>
              {list.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                  {list.description}
                </p>
              )}
            </div>

            {/* Action buttons - appears on hover */}
            <div className="flex scale-95 gap-1.5 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 lg:opacity-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={(e) => onEdit(e, list)}
                    className="text-muted-foreground shrink-0 rounded-lg"
                  >
                    <Edit />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit List</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={(e) => onDelete(e, list.id, list.name)}
                    className="text-destructive lg:text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-lg"
                  >
                    <Delete />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete List</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Created {formatDate(list.createdAt)}</span>
            </div>

            <div className="flex gap-1">
              {list.playlistLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={handleOpenVideo}
                      className="text-muted-foreground hover:text-primary shrink-0 rounded-lg"
                    >
                      <Play />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Watch Playlist</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleCopyLink}
                    className="text-muted-foreground hover:text-primary shrink-0 rounded-lg"
                  >
                    {isCopied ? (
                      <Tick className="text-green-500" />
                    ) : (
                      <CopyShare />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Share Link</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
