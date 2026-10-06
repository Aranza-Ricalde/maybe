import { TriangleExclamationFill } from "@gravity-ui/icons";
import { Card } from "@heroui/react";
import Link from "next/link";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { type CategoryBudgetInput, topCategoryBudgets } from "@/domain/budget/rules";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/domain/shared/routes";

const MAX_CATEGORIES_SHOWN = 4;

export interface BudgetByCategoryCardProps {
  categories: CategoryBudgetInput[];
}

export function BudgetByCategoryCard({ categories }: BudgetByCategoryCardProps) {
  const top = topCategoryBudgets(categories, MAX_CATEGORIES_SHOWN);
  if (top.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <EyebrowLabel>Presupuesto por categorías</EyebrowLabel>
        <Link href={ROUTES.budgets} className="shrink-0 text-xs text-accent hover:underline">
          Ver todo →
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {top.map((c) => (
          <div key={c.categoryId}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <Text weight="medium">{c.name}</Text>
                {c.isOverBudget && <Icon icon={TriangleExclamationFill} size="sm" className="text-danger" />}
              </div>
              <Text
                weight={c.isOverBudget ? "medium" : "normal"}
                tone={c.isOverBudget ? "danger" : "muted"}
                className="shrink-0 tabular-nums"
              >
                {formatCurrency(c.spentCents)} / {formatCurrency(c.budgetedCents)}
              </Text>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-separator">
              <div
                className={`h-full rounded-full ${c.isOverBudget ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${Math.min(100, (c.percent ?? 0) * 100)}%` }}
              />
            </div>
            <Text size="xs" tone={c.isOverBudget ? "danger" : "muted"} className="mt-1 block">
              {c.isOverBudget
                ? `${c.name} está ${formatCurrency(c.deviationCents)} por encima del presupuesto.`
                : `${formatCurrency(Math.abs(c.deviationCents))} disponibles en ${c.name}.`}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
