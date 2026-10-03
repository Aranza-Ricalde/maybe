import { PageSkeleton } from "@/components/molecules/PageSkeleton";

export default function BudgetsLoading() {
  return <PageSkeleton rows={6} withActionButton={false} />;
}
