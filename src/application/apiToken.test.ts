import assert from "node:assert/strict";
import { test } from "node:test";
import type { ApiTokenCodec, ApiTokenInfo, ApiTokenRepository } from "@/domain/captures/ports";
import { AuthenticateApiTokenUseCase, IssueApiTokenUseCase } from "./apiToken";

const reverse = (text: string) => [...text].reverse().join("");

function setup() {
  const stored = new Map<number, { hash: string; lastFour: string }>();
  let used = 0;
  const repo: ApiTokenRepository = {
    replaceToken: async (familyId, hash, lastFour) => void stored.set(familyId, { hash, lastFour }),
    findFamilyByHash: async (hash) => [...stored.entries()].find(([, value]) => value.hash === hash)?.[0] ?? null,
    markUsed: async () => void used++,
    describe: async (): Promise<ApiTokenInfo | null> => null,
  };
  let counter = 0;
  const codec: ApiTokenCodec = {
    generate: () => {
      const token = `mv_token-numero-${++counter}-abcdefghijklmnop`;
      return { token, tokenHash: reverse(token), lastFour: token.slice(-4) };
    },
    hash: reverse,
  };
  return { stored, repo, codec, uses: () => used };
}

test("emitir guarda solo el hash y el token en claro solo se devuelve una vez", async () => {
  const { stored, repo, codec } = setup();
  const token = await new IssueApiTokenUseCase(repo, codec).execute(1);

  assert.deepEqual([...stored.values()].map((v) => v.hash), [reverse(token)]);
  assert.ok(![...stored.values()].some((v) => JSON.stringify(v).includes(token)));
});

test("el token vigente identifica a su familia y regenerarlo invalida el anterior", async () => {
  const { repo, codec, uses } = setup();
  const issue = new IssueApiTokenUseCase(repo, codec);
  const auth = new AuthenticateApiTokenUseCase(repo, codec);
  const first = await issue.execute(7);

  assert.equal(await auth.execute(first), 7);
  assert.equal(uses(), 1);
  const second = await issue.execute(7);
  assert.equal(await auth.execute(first), null);
  assert.equal(await auth.execute(second), 7);
});

test("tokens ajenos o con formato inválido no autentican ni tocan la base", async () => {
  const { repo, codec, uses } = setup();
  const auth = new AuthenticateApiTokenUseCase(repo, codec);

  assert.equal(await auth.execute("cualquier-cosa"), null);
  assert.equal(await auth.execute("mv_corto"), null);
  assert.equal(await auth.execute("mv_desconocido-pero-con-longitud-suficiente"), null);
  assert.equal(uses(), 0);
});
