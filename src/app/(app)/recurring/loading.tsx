import { CardBlockSkeleton, PageHeaderSkeleton, TileRowSkeleton } from "@/components/molecules/Skeletons";

export default function RecurringLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TileRowSkeleton count={3} />
      <CardBlockSkeleton lines={6} />
    </>
  );
}
