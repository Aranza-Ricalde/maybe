import { CardBlockSkeleton, PageHeaderSkeleton, TileRowSkeleton } from "@/components/molecules/Skeletons";

export default function AccountsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TileRowSkeleton count={3} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardBlockSkeleton lines={2} />
        <CardBlockSkeleton lines={2} />
        <CardBlockSkeleton lines={2} />
      </div>
    </>
  );
}
