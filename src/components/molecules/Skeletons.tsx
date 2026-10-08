import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-8 w-36 rounded-lg" />}
    </div>
  );
}

export function TileRowSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardBlockSkeleton({ lines = 4, height, className }: { lines?: number; height?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-4", className)}>
      <Skeleton className="h-5 w-40" />
      {height ? (
        <Skeleton className={cn("w-full", height)} />
      ) : (
        Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-full max-w-56" />
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))
      )}
    </div>
  );
}

export function RingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="h-5 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
