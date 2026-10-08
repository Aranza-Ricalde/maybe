import { CardBlockSkeleton, PageHeaderSkeleton, TileRowSkeleton } from "@/components/molecules/Skeletons";

export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardBlockSkeleton lines={2} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardBlockSkeleton height="h-64" className="lg:col-span-2" />
        <TileRowSkeleton count={4} className="lg:grid-cols-1" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardBlockSkeleton lines={3} />
        <CardBlockSkeleton lines={3} />
        <CardBlockSkeleton lines={3} />
      </div>
    </>
  );
}
