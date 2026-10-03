import { PageSkeleton } from "@/components/molecules/PageSkeleton";

export default function SettingsLoading() {
  return <PageSkeleton rows={4} withActionButton={false} />;
}
