/**
 * Valida CleanMerchantNameUseCase contra la Gemini API real (no un mock) y
 * contra la base real de Neon: confirma que limpia un nombre de verdad, y
 * que el mismo patrón (incluso con detalles distintos) NO vuelve a llamar a
 * Gemini — ver domain/merchants/rules.ts::normalizeMerchantPattern.
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-merchant-cleaning.ts
 */
import { eq } from "drizzle-orm";
import { CleanMerchantNameUseCase } from "@/application/cleanMerchantName";
import type { MerchantNameCleaner } from "@/domain/merchants/ports";
import { db } from "@/infrastructure/db/client";
import { GeminiMerchantNameCleaner } from "@/infrastructure/gemini/merchantNameCleaner";
import { DrizzleMerchantPatternRepository } from "@/infrastructure/db/merchants";
import { DrizzleProvidersRepository } from "@/infrastructure/db/providers";
import { families } from "@/infrastructure/db/schema/core";
import { merchantPatterns } from "@/infrastructure/db/schema/classification";
import { providers } from "@/infrastructure/db/schema/providers";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

class CountingCleaner implements MerchantNameCleaner {
  calls = 0;
  constructor(private readonly inner: MerchantNameCleaner) {}
  async clean(rawDescription: string): Promise<string> {
    this.calls++;
    return this.inner.clean(rawDescription);
  }
}

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();

  const counting = new CountingCleaner(new GeminiMerchantNameCleaner());
  const providersRepo = new DrizzleProvidersRepository();
  const useCase = new CleanMerchantNameUseCase(new DrizzleMerchantPatternRepository(), counting, providersRepo);

  try {
    console.log("1) Primera vez que se ve este patrón — debe llamar a Gemini de verdad...");
    const first = await useCase.execute(family.id, "SP *UBER *TRIP 883219 MEXICO CITY MX");
    assert(counting.calls === 1, `se esperaba 1 llamada a Gemini, hubo ${counting.calls}`);
    assert(first.cleanName.toUpperCase().includes("UBER"), `el nombre limpio debía mencionar Uber, llegó "${first.cleanName}"`);
    assert(first.providerId != null, "debía resolver/crear un proveedor real, no quedó null");
    console.log(`   ✓ Gemini respondió "${first.cleanName}" (1 llamada real a la API), providerId=${first.providerId}`);

    console.log("2) Exactamente la misma descripción otra vez — debe venir del caché...");
    const second = await useCase.execute(family.id, "SP *UBER *TRIP 883219 MEXICO CITY MX");
    assert(counting.calls === 1, `no debía llamar a Gemini de nuevo, iba en ${counting.calls}`);
    assert(second.id === first.id, "debía devolver el mismo registro cacheado");
    console.log("   ✓ 0 llamadas nuevas a Gemini");

    console.log("3) Mismo comercio, folio de viaje DISTINTO — debe seguir cacheado (mismo patrón normalizado)...");
    const third = await useCase.execute(family.id, "SP *UBER *TRIP 991044 MEXICO CITY MX");
    assert(counting.calls === 1, `no debía llamar a Gemini de nuevo, iba en ${counting.calls}`);
    assert(third.id === first.id, "un folio de viaje distinto no debía generar un patrón nuevo");
    assert(third.providerId === first.providerId, "debía ser el mismo proveedor");
    console.log("   ✓ el folio numérico distinto no rompió el caché — sigue en 1 llamada real a Gemini en total");

    console.log("4) alreadyClean=true (entrada manual) — NO debe llamar a Gemini...");
    const manual = await useCase.execute(family.id, "Cinemex", true);
    assert(counting.calls === 1, `alreadyClean=true no debía llamar a Gemini, iba en ${counting.calls}`);
    assert(manual.cleanName === "Cinemex", `el nombre limpio debía ser exactamente el escrito, llegó "${manual.cleanName}"`);
    assert(manual.providerId != null, "debía resolver/crear el proveedor igual, sin pasar por Gemini");
    console.log("   ✓ 0 llamadas a Gemini para una entrada manual ya limpia");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(merchantPatterns).where(eq(merchantPatterns.familyId, family.id));
    await db.delete(providers).where(eq(providers.familyId, family.id));
    await db.delete(families).where(eq(families.id, family.id));
    console.log("Limpieza completa, no quedó basura en production.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
