export interface SwitchFormSpec {
  fields: Record<string, string | number>;
  stateField: { name: string; onValue: string; offValue: string };
}

export function buildSwitchFormData({ fields, stateField }: SwitchFormSpec, nextSelected: boolean): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, String(value));
  formData.set(stateField.name, nextSelected ? stateField.onValue : stateField.offValue);
  return formData;
}
