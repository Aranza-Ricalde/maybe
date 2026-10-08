import { CardBlockSkeleton, PageHeaderSkeleton } from "@/components/molecules/Skeletons";

export default function SettingsLoading() {
  return (
    <>
      <PageHeaderSkeleton withAction={false} />
      <CardBlockSkeleton lines={5} />
      <CardBlockSkeleton lines={4} />
    </>
  );
}
