export interface EntityLabels {
  createTrigger: string;
  createTitle: string;
  createSubmit: string;
  editTitle: string;
}

export function entityLabels(noun: string, gender: "f" | "m"): EntityLabels {
  const created = `${gender === "f" ? "Nueva" : "Nuevo"} ${noun}`;
  return { createTrigger: `+ ${created}`, createTitle: created, createSubmit: `Crear ${noun}`, editTitle: `Editar ${noun}` };
}

export const ENTITY = {
  goal: entityLabels("meta", "f"),
  recurringItem: entityLabels("recurrente", "m"),
  category: entityLabels("categoría", "f"),
  payPeriod: entityLabels("periodo", "m"),
} as const;

export const SAVE_CHANGES_LABEL = "Guardar cambios";
