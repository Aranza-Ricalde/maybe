import assert from "node:assert/strict";
import { test } from "node:test";
import type { AccessTokenIssuer, AuthRepository, PasswordHasher, SessionTokens, SessionWithUser, UserRecord } from "@/domain/auth/ports";
import { InvalidLoginError, LoginUseCase } from "./login";
import { LogoutUseCase } from "./logout";
import { RefreshAccessTokenUseCase } from "./refreshAccessToken";

const USER: UserRecord = { id: 1, familyId: 1, email: "a@b.mx", name: "Ana", passwordHash: "hash:secreto-largo-123" };

function setup() {
  const sessions = new Map<string, SessionWithUser>();
  const repo: AuthRepository = {
    hasAnyFamily: async () => true,
    findUserByEmail: async (email) => (email === USER.email ? USER : null),
    createFamilyWithUser: async () => USER,
    createSession: async (userId, tokenHash, expiresAt) => void sessions.set(tokenHash, { id: sessions.size + 1, userId, tokenHash, expiresAt, user: USER }),
    findSessionByTokenHash: async (tokenHash) => sessions.get(tokenHash) ?? null,
    deleteSessionByTokenHash: async (tokenHash) => void sessions.delete(tokenHash),
  };
  const hasher: PasswordHasher = { hash: async (plain) => `hash:${plain}`, verify: async (plain, hash) => hash === `hash:${plain}` };
  const tokens: SessionTokens = { generate: () => "token-crudo", hash: async (token) => `sha:${token}` };
  const accessTokens: AccessTokenIssuer = { sign: async (user) => `jwt:${user.id}`, verify: async () => null };
  return { sessions, repo, login: new LoginUseCase(repo, hasher, tokens, accessTokens), tokens, accessTokens };
}

test("login correcto guarda solo el hash del token de sesión y entrega un token de acceso", async () => {
  const { sessions, login } = setup();
  const result = await login.execute("a@b.mx", "secreto-largo-123");

  assert.equal(result.accessToken, "jwt:1");
  assert.equal(result.refreshToken, "token-crudo");
  assert.deepEqual([...sessions.keys()], ["sha:token-crudo"]);
  assert.ok(result.refreshExpiresAt.getTime() > Date.now());
});

test("login con correo desconocido o contraseña incorrecta falla igual, sin crear sesión", async () => {
  const { sessions, login } = setup();
  await assert.rejects(login.execute("otro@b.mx", "secreto-largo-123"), InvalidLoginError);
  await assert.rejects(login.execute("a@b.mx", "incorrecta"), InvalidLoginError);
  assert.equal(sessions.size, 0);
});

test("renovar con una sesión vigente emite un token nuevo; sin token o desconocido devuelve null", async () => {
  const { repo, tokens, accessTokens, login } = setup();
  const { refreshToken } = await login.execute("a@b.mx", "secreto-largo-123");
  const refresh = new RefreshAccessTokenUseCase(repo, tokens, accessTokens);

  assert.deepEqual(await refresh.execute(refreshToken), { accessToken: "jwt:1" });
  assert.equal(await refresh.execute(undefined), null);
  assert.equal(await refresh.execute("desconocido"), null);
});

test("una sesión expirada no renueva y se borra", async () => {
  const { sessions, repo, tokens, accessTokens } = setup();
  sessions.set("sha:vieja", { id: 9, userId: 1, tokenHash: "sha:vieja", expiresAt: new Date(Date.now() - 1000), user: USER });

  assert.equal(await new RefreshAccessTokenUseCase(repo, tokens, accessTokens).execute("vieja"), null);
  assert.equal(sessions.has("sha:vieja"), false);
});

test("cerrar sesión borra la sesión", async () => {
  const { sessions, repo, tokens, login } = setup();
  const { refreshToken } = await login.execute("a@b.mx", "secreto-largo-123");
  await new LogoutUseCase(repo, tokens).execute(refreshToken);

  assert.equal(sessions.size, 0);
});
