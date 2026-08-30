"use client";

import { useState } from "react";

import Image from "next/image";

import { companyGradient, companyInitial } from "../lib/company-color";

/**
 * The company tile used on the card, detail page and resources page. Renders
 * the uploaded logo when there is one and otherwise falls back to the existing
 * generated gradient-and-initial tile, so untouched experiences look exactly
 * as they did before logos existed.
 */
export function CompanyAvatar({
  companyName,
  logoUrl,
  size,
  className = "",
}: {
  companyName: string;
  logoUrl?: string | null;
  /** Tailwind size classes, e.g. "h-11 w-11". Rounding comes from `rounded`. */
  size: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (logoUrl && !imageFailed) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-border/60 bg-zinc-50 dark:bg-zinc-100 ${size} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          fill
          sizes="96px"
          unoptimized
          className="object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-linear-to-br font-extrabold text-white ${companyGradient(
        companyName,
      )} ${size} ${className}`}
    >
      {companyInitial(companyName)}
    </div>
  );
}
