import { eq } from "drizzle-orm";
import { CleanMerchantNameUseCase } from "@/application/cleanMerchantName";
import type { MerchantNameCleaner } from "@/domain/merchants/ports";
import { db } from "@/infrastructure/db/client";
import { DrizzleMerchantPatternRepository } from "@/infrastructure/db/merchants";
import { DrizzleProvidersRepository } from "@/infrastructure/db/providers";
import { families } from "@/infrastructure/db/schema/core";
import { merchantPatterns } from "@/infrastructure/db/schema/classification";
import { providers } from "@/infrastructure/db/schema/providers";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

class CountingAi implements MerchantNameCleaner {
  calls = 0;
  async clean(): Promise<string> {
    this.calls++;
    return "Respaldo IA";
  }
}

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [familyWithoutAi] = await db.insert(families).values({ name: "__smoke_test_sin_ia__", currency: "MXN" }).returning();

  const ai = new CountingAi();
  const aiCalls = () => ai.calls;
  const providersRepo = new DrizzleProvidersRepository();
  const useCase = new CleanMerchantNameUseCase(new DrizzleMerchantPatternRepository(), providersRepo, ai);

  try {
    console.log("1) El usuario registra a mano 'Uber' — nace el comercio, sin IA...");
    const typed = await useCase.execute(family.id, "Uber");
    assert(aiCalls() === 0, `no debía llamar a la IA, hubo ${aiCalls()}`);
    assert(typed.providerId != null, "debía crear un proveedor");
    console.log(`   ✓ "${typed.cleanName}" (providerId=${typed.providerId}), 0 llamadas a IA`);

    console.log("2) Llega del banco 'SP *UBER *TRIP 883219 MEXICO CITY MX' — se fusiona con el comercio conocido...");
    const first = await useCase.execute(family.id, "SP *UBER *TRIP 883219 MEXICO CITY MX");
    assert(first.providerId === typed.providerId, `debía fusionarse con el proveedor ${typed.providerId}, llegó ${first.providerId}`);
    assert(aiCalls() === 0, "no debía llamar a la IA");
    console.log("   ✓ mismo proveedor, sin intervención del usuario y sin IA");

    console.log("3) Mismo viaje con otro folio — sale del caché; y otra forma de escribirlo también se fusiona...");
    const second = await useCase.execute(family.id, "SP *UBER *TRIP 991044 MEXICO CITY MX");
    assert(second.id === first.id, "un folio distinto no debía crear un patrón nuevo");
    const variant = await useCase.execute(family.id, "UBR PENDING UBER COM");
    assert(variant.id !== first.id && variant.providerId === typed.providerId, "la variante debía fusionarse con el mismo proveedor");
    console.log("   ✓ el folio no rompe el caché y la variante comparte proveedor");

    console.log("4) Mismo comercio escrito distinto por el usuario (acentos, mayúsculas) — un solo proveedor...");
    const a = await useCase.execute(family.id, "Café Chavalete");
    const b = await useCase.execute(family.id, "CAFE CHAVALETE");
    assert(a.providerId === b.providerId, "debían compartir proveedor");
    const allProviders = await providersRepo.listForFamily(family.id);
    assert(allProviders.filter((p) => p.name.toLowerCase().normalize("NFD").includes("chavalete")).length === 1, "debía existir un solo proveedor 'chavalete'");
    console.log("   ✓ un solo proveedor para las dos escrituras");

    console.log("5) Transferencia SPEI — el comercio es la institución, no la nota del usuario...");
    const spei = await useCase.execute(family.id, "SPEI ENVIADO NU MEXICO PAGO TDC");
    assert(spei.cleanName === "Nu México", `debía ser "Nu México", llegó "${spei.cleanName}"`);
    console.log(`   ✓ "${spei.cleanName}"`);

    console.log("6) Sin nada utilizable — recién entonces se consulta el respaldo de IA...");
    assert(aiCalls() === 0, "hasta aquí la IA no debía haberse usado");
    const odd = await useCase.execute(family.id, "1234 5678");
    assert(aiCalls() === 1 && odd.cleanName === "Respaldo IA", `el respaldo debía usarse una vez, calls=${aiCalls()}, nombre=${odd.cleanName}`);
    console.log("   ✓ la IA solo se usó para lo irreconocible (1 llamada en total)");

    console.log("7) Sin IA configurada, lo irreconocible no falla ni inventa: queda sin identificar...");
    const noAi = new CleanMerchantNameUseCase(new DrizzleMerchantPatternRepository(), providersRepo);
    const none = await noAi.execute(familyWithoutAi.id, "9999 0000");
    assert(none.cleanName === "Sin identificar" && none.providerId != null, `debía quedar "Sin identificar" con proveedor, llegó "${none.cleanName}"`);
    assert(aiCalls() === 1, "sin IA configurada no debía haber llamadas adicionales");
    console.log(`   ✓ "${none.cleanName}"`);

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    for (const f of [family, familyWithoutAi]) {
      await db.delete(merchantPatterns).where(eq(merchantPatterns.familyId, f.id));
      await db.delete(providers).where(eq(providers.familyId, f.id));
      await db.delete(families).where(eq(families.id, f.id));
    }
    console.log("Limpieza completa.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
