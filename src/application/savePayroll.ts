import type { FamilyRecurringItem } from "@/domain/readModels/types";
import type { PayPeriodRecord } from "@/domain/payPeriod/ports";
import { buildPayrollPlan, isPayrollItem, type PayrollFrequency, type PayrollMode } from "@/domain/recurring/payroll";
import type { CreateRecurringItemRequest } from "./createRecurringItem";
import type { UpdateRecurringItemRequest } from "./updateRecurringItem";

export interface SavePayrollRequest {
  familyId: number;
  amount: number;
  frequency: PayrollFrequency;
  mode: PayrollMode;
  manualDays: number[];
  categoryId: number | null;
  accountId: number | null;
  today: string;
}

export interface SavePayrollDeps {
  listItems: (familyId: number) => Promise<FamilyRecurringItem[]>;
  listPeriods: (familyId: number, today: string) => Promise<PayPeriodRecord[]>;
  create: (input: CreateRecurringItemRequest) => Promise<void>;
  update: (input: UpdateRecurringItemRequest) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export class SavePayrollUseCase {
  constructor(private readonly deps: SavePayrollDeps) {}

  async execute(input: SavePayrollRequest): Promise<void> {
    const periods = input.mode === "sync" ? await this.deps.listPeriods(input.familyId, input.today) : [];
    const plan = buildPayrollPlan({ frequency: input.frequency, mode: input.mode, manualDays: input.manualDays, periods, today: input.today });
    const existing = (await this.deps.listItems(input.familyId)).filter(isPayrollItem).sort((a, b) => a.dayOfMonth - b.dayOfMonth);

    for (const [index, item] of plan.entries()) {
      const common = { name: item.name, flow: "income" as const, estimatedAmount: input.amount, dayOfMonth: item.dayOfMonth, categoryId: input.categoryId, accountId: input.accountId };
      const current = existing[index];
      if (current) await this.deps.update({ id: current.id, ...common });
      else await this.deps.create({ familyId: input.familyId, ...common });
    }
    for (const extra of existing.slice(plan.length)) await this.deps.remove(extra.id);
  }
}
