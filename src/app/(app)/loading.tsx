import { PageSkeleton } from "@/components/molecules/PageSkeleton";

export default function DashboardLoading() {
  return <PageSkeleton rows={6} withActionButton={false} />;
}
