import { SavePayrollUseCase } from "@/application/savePayroll";
import { createRecurringItemUseCase, deleteRecurringItemUseCase, listPayPeriodsUseCase, updateRecurringItemUseCase } from "./core";
import { planningReader } from "./readers";

export const savePayrollUseCase = new SavePayrollUseCase({
  listItems: (familyId) => planningReader.recurringItems(familyId),
  listPeriods: (familyId, today) => listPayPeriodsUseCase.execute(familyId, today),
  create: (input) => createRecurringItemUseCase.execute(input),
  update: (input) => updateRecurringItemUseCase.execute(input),
  remove: (id) => deleteRecurringItemUseCase.execute(id),
});
