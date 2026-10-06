import { z } from "zod";

export const MAX_PESOS = 1_000_000_000;
export const MAX_PAGE_SIZE = 100;

export const idField = z.coerce.number().int().positive();
export const optionalIdField = z.preprocess((value) => (value === "" || value == null ? null : value), idField.nullable());
export const requiredText = (max = 200) => z.string().trim().min(1).max(max);
export const optionalText = (max = 500) => z.string().trim().max(max).transform((value) => (value === "" ? null : value));
export const pesosField = z.coerce.number().refine((value) => Number.isFinite(value) && Math.abs(value) <= MAX_PESOS, "monto fuera de rango");
export const nonZeroPesosField = pesosField.refine((value) => value !== 0, "el monto no puede ser cero");
export const positivePesosField = pesosField.refine((value) => value > 0, "el monto debe ser positivo");
export const isoDateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}, "fecha inexistente");
export const pageField = z.coerce.number().int().min(1).max(100_000);
export const pageSizeField = z.coerce.number().int().min(1).max(MAX_PAGE_SIZE);

export function formObject(formData: FormData): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const result: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(formData.keys())) {
    const values = formData.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

export function parseForm<S extends z.ZodType>(formData: FormData, schema: S): z.output<S> | null {
  const parsed = schema.safeParse(formObject(formData));
  return parsed.success ? parsed.data : null;
}

export function parseValue<S extends z.ZodType>(value: unknown, schema: S): z.output<S> | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
