import { Skeleton } from "@heroui/react";

export interface PageSkeletonProps {
  rows?: number;
  withActionButton?: boolean;
}

export function PageSkeleton({ rows = 5, withActionButton = true }: PageSkeletonProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        {withActionButton && <Skeleton className="h-9 w-40 rounded-full" />}
      </div>

      <div className="rounded-xl border border-separator bg-surface p-5">
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-full max-w-56" />
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
