import { CardBlockSkeleton, PageHeaderSkeleton, TileRowSkeleton } from "@/components/molecules/Skeletons";

export default function StatsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TileRowSkeleton count={4} className="lg:grid-cols-4" />
      <CardBlockSkeleton height="h-72" />
      <CardBlockSkeleton lines={5} />
    </>
  );
}
