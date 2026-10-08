import { CardBlockSkeleton, PageHeaderSkeleton, RingGridSkeleton } from "@/components/molecules/Skeletons";

export default function BudgetsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardBlockSkeleton lines={3} />
        <CardBlockSkeleton lines={3} />
      </div>
      <RingGridSkeleton />
    </>
  );
}
