/**
 * Valida bootstrap/login/validateAccessToken/refreshAccessToken/logout contra la base real de Neon.
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-auth.ts
 */
import { eq } from "drizzle-orm";
import { BootstrapFamilyUseCase, FamilyAlreadyExistsError } from "@/application/bootstrapFamily";
import { InvalidLoginError, LoginUseCase } from "@/application/login";
import { LogoutUseCase } from "@/application/logout";
import { RefreshAccessTokenUseCase } from "@/application/refreshAccessToken";
import { ValidateAccessTokenUseCase } from "@/application/validateAccessToken";
import { DrizzleAuthRepository } from "@/infrastructure/db/auth";
import { db } from "@/infrastructure/db/client";
import { sessions } from "@/infrastructure/db/schema/auth";
import { families, users } from "@/infrastructure/db/schema/core";
import { JoseAccessTokenIssuer, loadAuthSecret } from "@/infrastructure/auth/accessTokens";
import { ScryptPasswordHasher } from "@/infrastructure/auth/passwordHasher";
import { CryptoSessionTokens } from "@/infrastructure/auth/sessionTokens";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

async function main() {
  const repo = new DrizzleAuthRepository();
  const hasher = new ScryptPasswordHasher();
  const tokens = new CryptoSessionTokens();
  const accessTokens = new JoseAccessTokenIssuer(loadAuthSecret());

  // hasAnyFamily() debe reflejar el estado real de la base, así que primero
  // confirmamos que no hay ninguna family de una corrida anterior fallida.
  const preexisting = await db.select({ id: families.id }).from(families).limit(1);
  assert(preexisting.length === 0, "ya hay una family en la base — limpia antes de correr este smoke test");

  let userId: number | undefined;
  try {
    console.log("1) BootstrapFamilyUseCase (primera vez, debe funcionar)...");
    const bootstrap = new BootstrapFamilyUseCase(repo, hasher);
    const user = await bootstrap.execute({
      familyName: "__smoke_test_family__",
      currency: "MXN",
      email: "smoke-test@example.com",
      password: "correcthorsebattery",
      name: "Smoke Test",
    });
    userId = user.id;
    assert(user.email === "smoke-test@example.com", "el email del usuario creado no coincide");
    console.log(`   ✓ family + usuario creados (userId=${user.id})`);

    console.log("2) BootstrapFamilyUseCase otra vez (debe rechazar, ya existe family)...");
    let rejectedSecondBootstrap = false;
    try {
      await bootstrap.execute({
        familyName: "otra",
        currency: "MXN",
        email: "otro@example.com",
        password: "correcthorsebattery",
        name: "Otro",
      });
    } catch (err) {
      if (err instanceof FamilyAlreadyExistsError) rejectedSecondBootstrap = true;
      else throw err;
    }
    assert(rejectedSecondBootstrap, "un segundo bootstrap debió rechazarse con FamilyAlreadyExistsError");
    console.log("   ✓ rechazado correctamente — no es un signup público");

    console.log("3) LoginUseCase con contraseña incorrecta (debe fallar)...");
    const login = new LoginUseCase(repo, hasher, tokens, accessTokens);
    let wrongPasswordRejected = false;
    try {
      await login.execute("smoke-test@example.com", "la-contraseña-equivocada");
    } catch (err) {
      if (err instanceof InvalidLoginError) wrongPasswordRejected = true;
      else throw err;
    }
    assert(wrongPasswordRejected, "login con contraseña incorrecta debió fallar");
    console.log("   ✓ contraseña incorrecta rechazada");

    console.log("4) LoginUseCase con credenciales correctas...");
    const { accessToken, refreshToken, refreshExpiresAt } = await login.execute(
      "smoke-test@example.com",
      "correcthorsebattery",
    );
    assert(typeof accessToken === "string" && accessToken.length > 20, "el access token debe ser un JWT largo");
    assert(typeof refreshToken === "string" && refreshToken.length > 20, "el refresh token debe ser un string largo");
    assert(refreshExpiresAt instanceof Date, "refreshExpiresAt debe ser una fecha");
    const [sessionRow] = await db.select().from(sessions).where(eq(sessions.userId, userId));
    assert(sessionRow.tokenHash !== refreshToken, "la base NUNCA debe guardar el refresh token crudo, solo su hash");
    console.log("   ✓ login exitoso, access+refresh tokens generados, la base guarda solo el hash del refresh");

    console.log("5) ValidateAccessTokenUseCase con el access token recién emitido...");
    const validateAccessToken = new ValidateAccessTokenUseCase(accessTokens);
    const validatedUser = await validateAccessToken.execute(accessToken);
    assert(validatedUser?.id === userId, "el access token válido debió resolver al usuario correcto");
    console.log("   ✓ access token válido resuelve al usuario correcto");

    console.log("6) ValidateAccessTokenUseCase con un token inventado (debe devolver null)...");
    const fakeResult = await validateAccessToken.execute("esto-no-es-un-token-real");
    assert(fakeResult === null, "un token inventado nunca debe resolver a un usuario");
    console.log("   ✓ token inválido devuelve null");

    console.log("7) RefreshAccessTokenUseCase con el refresh token recién emitido...");
    const refresh = new RefreshAccessTokenUseCase(repo, tokens, accessTokens);
    const refreshed = await refresh.execute(refreshToken);
    assert(refreshed !== null, "el refresh token válido debió emitir un nuevo access token");
    const refreshedUser = await validateAccessToken.execute(refreshed.accessToken);
    assert(refreshedUser?.id === userId, "el access token renovado debió resolver al usuario correcto");
    console.log("   ✓ refresh token válido emite un access token nuevo y válido");

    console.log("8) RefreshAccessTokenUseCase con un refresh token inventado (debe devolver null)...");
    const fakeRefresh = await refresh.execute("esto-no-es-un-refresh-token-real");
    assert(fakeRefresh === null, "un refresh token inventado nunca debe emitir un access token");
    console.log("   ✓ refresh token inválido devuelve null");

    console.log("9) LogoutUseCase...");
    const logout = new LogoutUseCase(repo, tokens);
    await logout.execute(refreshToken);
    const afterLogout = await refresh.execute(refreshToken);
    assert(afterLogout === null, "después de logout, el mismo refresh token ya no debe renovar nada");
    console.log("   ✓ logout invalida la sesión (refresh token revocado)");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    if (userId) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    await db.delete(families).where(eq(families.name, "__smoke_test_family__"));
    console.log("Limpieza completa, no quedó basura en production.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
