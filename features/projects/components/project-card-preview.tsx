"use client";

import { useState } from "react";

import Image from "next/image";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";

import NoImage from "@/components/icons/no-image";

import { getSiteMetadata } from "@/features/projects/lib/actions";

import { Loader } from "@/components/icons";

interface ProjectCardPreviewProps {
  liveLink: string;
}

export function ProjectCardPreview({ liveLink }: ProjectCardPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch metadata
  const { data: metadata, isLoading } = useQuery({
    queryKey: ["project-metadata", liveLink],
    queryFn: () => getSiteMetadata(liveLink),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Get the best available image (prefer Twitter for large images)
  const previewImage = metadata?.twitter.image || metadata?.openGraph.image;
  const previewTitle =
    metadata?.twitter.title ||
    metadata?.openGraph.title ||
    metadata?.html.title;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <div className="aspect-2/1 w-full overflow-hidden rounded-t-xl">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-t-xl">
        {previewImage && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="text-muted-foreground size-3.5" />
              </div>
            )}
            <Image
              src={previewImage}
              alt={previewTitle || "Project preview"}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              onLoad={() => setImageLoading(false)}
            />
            <p className="text-muted-foreground bg-muted absolute bottom-3 mx-2 line-clamp-1 rounded-lg px-2.5 py-1 text-[13px] leading-4">
              {previewTitle}
            </p>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <NoImage className="text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
