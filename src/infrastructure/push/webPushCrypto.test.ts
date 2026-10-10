import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeBase64Url, encryptPushPayload } from "./webPushCrypto";

test("cifra el mensaje igual que el vector de prueba del RFC 8291", () => {
  const body = encryptPushPayload({
    payload: Buffer.from("When I grow up, I want to be a watermelon"),
    userPublicKey: decodeBase64Url("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
    authSecret: decodeBase64Url("BTBZMqHH6r4Tts7J_aSIgg"),
    serverKeys: {
      privateKey: decodeBase64Url("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"),
      publicKey: decodeBase64Url("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8"),
    },
    salt: decodeBase64Url("DGv6ra1nlYgDCS1FRnbzlw"),
  });
  assert.equal(
    body.toString("base64url"),
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
  );
});
