"use client";

import { useState } from "react";

import Image from "next/image";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Discord, Loader, PeerList, X } from "@/components/icons/";
import NoImage from "@/components/icons/no-image";

import { getSiteMetadata } from "../lib/actions";

interface PlatformPreviewProps {
  liveLink: string;
}

export function PlatformPreview({ liveLink }: PlatformPreviewProps) {
  const [twitterImageError, setTwitterImageError] = useState(false);
  const [discordImageError, setDiscordImageError] = useState(false);
  const [peerlistImageError, setPeerlistImageError] = useState(false);

  // ✅ new loading states for images
  const [twitterImageLoading, setTwitterImageLoading] = useState(true);
  const [discordImageLoading, setDiscordImageLoading] = useState(true);
  const [peerlistImageLoading, setPeerlistImageLoading] = useState(true);
  const [faviconLoading, setFaviconLoading] = useState(true);

  // Fetch metadata
  const { data: metadata, isLoading } = useQuery({
    queryKey: ["project-metadata", liveLink],
    queryFn: () => getSiteMetadata(liveLink),
  });

  // Twitter uses twitter-specific metadata with fallbacks
  const twitterTitle =
    metadata?.twitter.title ||
    metadata?.openGraph.title ||
    metadata?.html.title;

  const twitterDescription =
    metadata?.twitter.description ||
    metadata?.openGraph.description ||
    metadata?.html.description;
  const twitterImage = metadata?.twitter.image || metadata?.openGraph.image;

  // Discord uses Open Graph metadata
  const discordTitle = metadata?.openGraph.title || metadata?.html.title;
  const discordDescription =
    metadata?.openGraph.description || metadata?.html.description;
  const discordImage = metadata?.openGraph.image;

  // Peerlist uses similar metadata to Twitter
  const peerlistTitle =
    metadata?.twitter.title ||
    metadata?.openGraph.title ||
    metadata?.html.title;
  const peerlistDescription =
    metadata?.twitter.description ||
    metadata?.openGraph.description ||
    metadata?.html.description;
  const peerlistImage = metadata?.twitter.image || metadata?.openGraph.image;

  const hostname = new URL(liveLink).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  return (
    <Tabs defaultValue="twitter" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="twitter" className="gap-1.5">
          <X className="h-3.5 w-3.5" />
          Twitter
        </TabsTrigger>
        <TabsTrigger value="discord" className="gap-1.5">
          <Discord className="h-3.5 w-3.5" />
          Discord
        </TabsTrigger>
        <TabsTrigger value="peerlist" className="gap-1.5">
          <PeerList className="h-3.5 w-3.5" />
          Peerlist
        </TabsTrigger>
      </TabsList>

      {/* ---------------- TWITTER ---------------- */}
      <TabsContent value="twitter" className="mt-3">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="aspect-2/1 w-full rounded-xl" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <>
            {metadata?.twitter.card === "summary_large_image" ? (
              <div className="flex flex-col gap-1">
                <div className="relative aspect-2/1 w-full overflow-hidden rounded-xl">
                  {twitterImage && !twitterImageError ? (
                    <>
                      {twitterImageLoading && (
                        <Loader className="text-muted-foreground size-3.5" />
                      )}
                      <Image
                        src={twitterImage}
                        alt={twitterTitle || "Twitter Image Title"}
                        fill
                        className={`object-cover transition-opacity duration-300 ${
                          twitterImageLoading ? "opacity-0" : "opacity-100"
                        }`}
                        onError={() => setTwitterImageError(true)}
                        onLoad={() => setTwitterImageLoading(false)}
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <NoImage className="text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-muted-foreground bg-muted absolute bottom-3 left-2 line-clamp-1 rounded-lg px-2.5 py-1 text-[13px] leading-4">
                    {twitterTitle}
                  </p>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-[13px] leading-4">
                  From {hostname}
                </p>
              </div>
            ) : (
              <div className="group border-border overflow-hidden rounded-2xl border">
                <div className="bg-muted/10 flex">
                  <div className="bg-muted relative h-[125px] w-[125px] shrink-0">
                    {twitterImage && !twitterImageError ? (
                      <>
                        {twitterImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader className="text-muted-foreground size-3.5" />
                          </div>
                        )}
                        <Image
                          src={twitterImage}
                          alt={twitterTitle || "Twitter Image Title"}
                          fill
                          className={`object-cover transition-opacity duration-300 ${
                            twitterImageLoading ? "opacity-0" : "opacity-100"
                          }`}
                          onError={() => setTwitterImageError(true)}
                          onLoad={() => setTwitterImageLoading(false)}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <NoImage className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1 p-3">
                    <p className="text-muted-foreground line-clamp-1 text-[14px] leading-4">
                      {hostname}
                    </p>
                    <p className="text-accent-foreground line-clamp-1 text-[15px] leading-5 font-normal">
                      {twitterTitle}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-[14px] leading-4">
                      {twitterDescription}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* ---------------- DISCORD ---------------- */}
      <TabsContent value="discord" className="mt-3">
        {isLoading ? (
          <div className="bg-muted/10 border-l-primary rounded-md border border-l-4 p-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
            </div>
          </div>
        ) : (
          <div className="bg-muted/10 border-l-primary rounded-md border border-l-4 p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <p className="text-primary text-sm font-semibold">
                  {discordTitle}
                </p>
                <p className="text-muted-foreground line-clamp-3 text-xs">
                  {discordDescription}
                </p>
              </div>

              <div className="bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {discordImage && !discordImageError ? (
                  <>
                    {discordImageLoading && (
                      <Loader className="text-muted-foreground absolute size-3.5" />
                    )}
                    <Image
                      src={discordImage}
                      alt={discordTitle || "Discord Image Title"}
                      width={200}
                      height={200}
                      className={`h-full w-full object-contain transition-opacity duration-300 ${
                        discordImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onError={() => {
                        setDiscordImageError(true);
                        setDiscordImageLoading(false);
                      }}
                      onLoad={() => setDiscordImageLoading(false)}
                    />
                  </>
                ) : (
                  <NoImage className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        )}
      </TabsContent>

      {/* ---------------- PEERLIST ---------------- */}
      <TabsContent value="peerlist" className="mt-3">
        {isLoading ? (
          <div className="group border-border overflow-hidden rounded-2xl border">
            <div className="bg-muted/10 flex items-center px-3">
              <div className="flex flex-1 flex-col justify-center gap-2 py-5 pr-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center gap-1.5 pt-2">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
            </div>
          </div>
        ) : (
          <div className="group border-border overflow-hidden rounded-2xl border">
            <div className="bg-muted/10 flex items-center p-3">
              <div className="flex flex-1 flex-col justify-center gap-1 py-5 pr-3">
                <p className="text-accent-foreground line-clamp-1 text-[15px] leading-5 font-normal">
                  {peerlistTitle}
                </p>
                <p className="text-muted-foreground line-clamp-2 text-[14px] leading-4">
                  {peerlistDescription}
                </p>
                <div className="flex flex-1 items-end gap-1.5">
                  <div className="relative h-3 w-3">
                    {faviconLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="text-muted-foreground size-2" />
                      </div>
                    )}
                    <Image
                      src={faviconUrl}
                      alt={`${hostname} favicon`}
                      width={12}
                      height={12}
                      className={`rounded-sm transition-opacity duration-300 ${
                        faviconLoading ? "opacity-0" : "opacity-100"
                      }`}
                      unoptimized
                      onLoad={() => setFaviconLoading(false)}
                    />
                  </div>
                  <p className="text-muted-foreground line-clamp-1 text-[12px] leading-4">
                    {hostname}
                  </p>
                </div>
              </div>

              <div className="bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {peerlistImage && !peerlistImageError ? (
                  <>
                    {peerlistImageLoading && (
                      <Loader className="text-muted-foreground absolute size-3.5" />
                    )}
                    <Image
                      src={peerlistImage}
                      alt={peerlistTitle || "Peerlist Image Title"}
                      width={200}
                      height={200}
                      className={`h-full w-full object-contain transition-opacity duration-300 ${
                        peerlistImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onError={() => {
                        setPeerlistImageError(true);
                        setPeerlistImageLoading(false);
                      }}
                      onLoad={() => setPeerlistImageLoading(false)}
                    />
                  </>
                ) : (
                  <NoImage className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
