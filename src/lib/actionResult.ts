export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export type FormAction = (formData: FormData) => Promise<ActionResult | void> | ActionResult | void;

export const actionOk = (message: string): ActionResult => ({ ok: true, message });

export const actionFailed = (message: string): ActionResult => ({ ok: false, message });

export const GENERIC_FAILURE_MESSAGE = "No se pudo completar la acción. Inténtalo de nuevo.";
export const INVALID_FORM_MESSAGE = "Revisa los datos del formulario e inténtalo de nuevo.";
export const NOT_FOUND_MESSAGE = "No encontramos ese registro.";

export function sentenceCase(message: string): string {
  const trimmed = message.trim();
  if (trimmed === "") return GENERIC_FAILURE_MESSAGE;
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function isFailed(result: ActionResult | void): result is Extract<ActionResult, { ok: false }> {
  return result != null && !result.ok;
}
