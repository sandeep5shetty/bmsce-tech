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
  if (logoUrl) {
    return (
      <div
        className={`bg-card relative shrink-0 overflow-hidden border ${size} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          fill
          sizes="96px"
          className="object-contain p-1"
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
