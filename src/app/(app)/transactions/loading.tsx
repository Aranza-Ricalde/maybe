import { CardBlockSkeleton, PageHeaderSkeleton } from "@/components/molecules/Skeletons";

export default function TransactionsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardBlockSkeleton lines={8} />
    </>
  );
}
