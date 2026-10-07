import { normalizeForMatch } from "@/domain/shared/text";
import { InvalidCategoryError } from "./rules";

export const MAX_CATEGORY_DESCRIPTION_LENGTH = 300;

const SUGGESTED: Record<string, string> = {
  ahorro: "Dinero que apartas para ti antes de gastar: fondos y metas. No es un gasto, es lo que separas.",
  "ahorro auto": "Lo que vas juntando para tu auto: enganche, mantenimiento mayor o cambio de unidad.",
  "ahorro emergencia": "Colchón para imprevistos: se usa solo si te quedas sin ingresos o tienes un gasto urgente.",
  alimentacion: "Todo lo que comes: despensa, restaurantes, delivery, café y snacks.",
  "cafe y snacks": "Café, botanas, panadería y antojos fuera de casa.",
  delivery: "Comida a domicilio: Uber Eats, Didi Food, Rappi.",
  despensa: "Supermercado y tienda de abarrotes para cocinar en casa.",
  restaurantes: "Comidas fuera de casa: restaurantes, fondas y taquerías.",
  "compras personales": "Cosas para ti que no son indispensables: ropa, accesorios, tecnología, regalos.",
  "gasto externo": "Gastos que haces por cuenta de otra persona o negocio, para separarlos de los tuyos.",
  imprevistos: "Gastos que no planeaste y no encajan en otra categoría: reparaciones urgentes, multas, emergencias.",
  ocio: "Diversión y tiempo libre: salidas, suscripciones, juegos.",
  "apuestas y juegos de azar": "Dinero en apuestas, casinos, loterías y sorteos.",
  salidas: "Planes para salir: cine, bares, conciertos y eventos.",
  "suscripciones y streaming": "Pagos mensuales de plataformas: Netflix, Spotify, Xbox, Prime.",
  "otro ingreso": "Ingresos que no son sueldo ni rendimientos: ventas, bonos únicos, dinero que te regalan.",
  "prestamo recibido": "Dinero que te prestan: no es ingreso propio, es una deuda que tendrás que pagar.",
  "prestamos y deudas": "Pagos de deudas: tarjetas de crédito, préstamos personales, créditos.",
  reembolso: "Dinero que te devuelven por un gasto: devoluciones y reembolsos.",
  rendimientos: "Intereses y ganancias de tu dinero: Cajitas, inversiones, cuentas con rendimiento.",
  salario: "Tu sueldo y nómina.",
  salud: "Cuidado de tu salud: consultas, medicinas, estudios y seguros médicos.",
  "gimnasio y bienestar": "Gimnasio, deporte, terapia y todo lo que cuida tu cuerpo y mente.",
  servicios: "Pagos del hogar que llegan cada mes: agua, luz, gas, internet y teléfono.",
  agua: "Recibo del agua de tu casa.",
  electricidad: "Recibo de luz (CFE).",
  gas: "Gas LP o gas natural de tu casa.",
  internet: "Internet de tu casa.",
  telefonia: "Plan o recargas de celular.",
  transporte: "Cómo te mueves: gasolina, transporte público, taxis, apps de viaje y el auto.",
  auto: "Gastos del auto: gasolina, verificación, seguro, mantenimiento y estacionamiento.",
  vivienda: "Donde vives: renta, mantenimiento y depósitos.",
  "mantenimiento y reparaciones": "Arreglos de tu casa: plomería, pintura, electricista, refacciones.",
  "mudanza y deposito": "Gastos de cambiarte de casa: flete, depósito en garantía, primer mes.",
  renta: "El pago mensual de tu casa o departamento.",
};

export function normalizeCategoryDescription(raw: string | null | undefined): string | null {
  const text = raw?.trim() ?? "";
  return text === "" ? null : text;
}

export function assertValidCategoryDescription(description: string | null | undefined): void {
  if (description != null && description.length > MAX_CATEGORY_DESCRIPTION_LENGTH) {
    throw new InvalidCategoryError(`La descripción no puede pasar de ${MAX_CATEGORY_DESCRIPTION_LENGTH} caracteres.`);
  }
}

export interface ResolvedCategoryDescription {
  text: string | null;
  isSuggested: boolean;
}

export function resolveCategoryDescription(name: string, stored: string | null | undefined): ResolvedCategoryDescription {
  const own = normalizeCategoryDescription(stored);
  if (own) return { text: own, isSuggested: false };
  const suggested = SUGGESTED[normalizeForMatch(name)];
  return suggested ? { text: suggested, isSuggested: true } : { text: null, isSuggested: false };
}
