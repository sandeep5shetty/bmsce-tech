import { Skeleton } from "@/components/ui/skeleton";

export function ListsGridSkeleton() {
  return (
    <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Create List Card Skeleton */}
      <div className="bg-card flex h-full items-center justify-center rounded-xl border-2 border-dashed p-8">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* List Card Skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <article
          key={i}
          className="bg-card relative overflow-hidden rounded-xl border"
        >
          <div className="relative flex h-full flex-col gap-4 p-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-4/5" />
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <div className="inline-flex gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
