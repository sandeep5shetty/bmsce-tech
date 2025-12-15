"use client";

import Plus from "@/components/icons/plus";

interface CreateListCardProps {
  onClick: () => void;
}

export function CreateListCard({ onClick }: CreateListCardProps) {
  return (
    <article
      onClick={onClick}
      className="bg-card hover:shadow-primary/5 group hover:border-primary/30 relative flex h-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed p-8 transition-all duration-300"
    >
      {/* Gradient overlay on hover */}
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col items-center gap-3">
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300">
          <Plus className="h-7 w-7" />
        </div>

        <div className="text-center">
          <h3 className="mb-1 text-base font-semibold tracking-tight">
            Add List
          </h3>
          <p className="text-muted-foreground text-sm">Collect amazing work.</p>
        </div>
      </div>
    </article>
  );
}
