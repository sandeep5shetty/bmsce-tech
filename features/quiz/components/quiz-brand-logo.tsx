"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";

import { resolveQuizMediaSrc } from "@/lib/s3/storage";

import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: { box: "h-8 w-8", image: 32 },
  md: { box: "h-10 w-10", image: 40 },
  lg: { box: "h-12 w-12", image: 48 },
  xl: { box: "h-16 w-16", image: 64 },
  hero: { box: "h-20 w-20 sm:h-24 sm:w-24", image: 96 },
} as const;

type QuizBrandLogoSize = keyof typeof SIZE_MAP;

interface QuizBrandLogoProps {
  logoUrl?: string | null;
  size?: QuizBrandLogoSize;
  className?: string;
  priority?: boolean;
  /** Adds a subtle frame — useful on gradient headers */
  framed?: boolean;
}

export function QuizBrandLogo({
  logoUrl,
  size = "md",
  className,
  priority = false,
  framed = false,
}: QuizBrandLogoProps) {
  const { box, image } = SIZE_MAP[size];
  const [failed, setFailed] = useState(false);
  const trimmed = logoUrl?.trim();
  const showEventLogo = Boolean(trimmed) && !failed;
  const eventSrc = showEventLogo ? resolveQuizMediaSrc(trimmed) : "";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        box,
        showEventLogo && "rounded-xl",
        framed &&
          showEventLogo &&
          "border border-white/25 shadow-sm",
        framed &&
          !showEventLogo &&
          "rounded-xl border border-white/20 bg-white/95 p-1 shadow-sm dark:bg-background/90",
        className,
      )}
    >
      {showEventLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={eventSrc}
          alt=""
          width={image}
          height={image}
          className="block h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Image
          src="/bmsce.svg"
          alt="BMSCE.tech"
          width={image}
          height={image}
          className="h-full w-full object-contain p-0.5"
          priority={priority}
        />
      )}
    </div>
  );
}

interface QuizEventBrandProps {
  title: string;
  logoUrl?: string | null;
  subtitle?: ReactNode;
  size?: QuizBrandLogoSize;
  align?: "center" | "start";
  framed?: boolean;
  className?: string;
}

export function QuizEventBrand({
  title,
  logoUrl,
  subtitle,
  size = "lg",
  align = "center",
  framed = false,
  className,
}: QuizEventBrandProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex gap-3",
        centered ? "flex-col items-center text-center" : "items-center text-left",
        className,
      )}
    >
      <QuizBrandLogo logoUrl={logoUrl} size={size} framed={framed} priority />
      <div className={cn("min-w-0 space-y-1", centered && "w-full")}>
        <h1
          className={cn(
            "font-bold tracking-tight break-words",
            centered ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
