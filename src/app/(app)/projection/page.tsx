import { getProjectionPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CashProjectionCard } from "@/components/organisms/CashProjectionCard";
import { ProjectionSimulator } from "@/components/organisms/ProjectionSimulator";
import { todayIso } from "@/lib/today";
import { setMinimumBalance } from "./actions";

export default async function ProjectionPage() {
  const user = await requireUser();
  const { basisMonths, assumptions, base, cash } = await getProjectionPageUseCase.execute(user.familyId, todayIso());

  return (
    <>
      <PageHeader title="Proyección" subtitle="Hacia dónde va tu saldo y qué cambia si tomas una decisión." />
      <CashProjectionCard view={cash} minimumAction={setMinimumBalance} />

      {basisMonths.length === 0 ? (
        <EmptyState title="Todavía no hay con qué proyectar" description="Necesitas al menos un mes completo con movimientos para estimar tus promedios." />
      ) : (
        <ProjectionSimulator base={base} basisMonths={basisMonths} assumptions={assumptions} />
      )}
    </>
  );
}
