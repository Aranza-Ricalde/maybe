import { CardBlockSkeleton, PageHeaderSkeleton } from "@/components/molecules/Skeletons";

export default function ImportLoading() {
  return (
    <>
      <PageHeaderSkeleton withAction={false} />
      <CardBlockSkeleton height="h-40" />
      <CardBlockSkeleton lines={4} />
    </>
  );
}
