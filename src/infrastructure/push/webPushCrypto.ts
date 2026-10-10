import { createCipheriv, createECDH, hkdfSync, randomBytes } from "node:crypto";

const RECORD_SIZE = 4096;
const PUBLIC_KEY_BYTES = 65;
const LAST_RECORD_DELIMITER = Buffer.from([2]);

export interface PushKeyPair {
  privateKey: Buffer;
  publicKey: Buffer;
}

export interface EncryptPushInput {
  payload: Buffer;
  userPublicKey: Buffer;
  authSecret: Buffer;
  serverKeys?: PushKeyPair;
  salt?: Buffer;
}

const fromBase64Url = (value: string) => Buffer.from(value, "base64url");

export function decodeBase64Url(value: string): Buffer {
  return fromBase64Url(value);
}

export function generateServerKeys(): PushKeyPair {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { privateKey: ecdh.getPrivateKey(), publicKey: ecdh.getPublicKey() };
}

function derive(ikm: Buffer, salt: Buffer, info: Buffer, length: number): Buffer {
  return Buffer.from(hkdfSync("sha256", ikm, salt, info, length));
}

export function encryptPushPayload({ payload, userPublicKey, authSecret, serverKeys = generateServerKeys(), salt = randomBytes(16) }: EncryptPushInput): Buffer {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(serverKeys.privateKey);
  const sharedSecret = ecdh.computeSecret(userPublicKey);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), userPublicKey, serverKeys.publicKey]);
  const inputKeyMaterial = derive(sharedSecret, authSecret, keyInfo, 32);
  const contentKey = derive(inputKeyMaterial, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = derive(inputKeyMaterial, salt, Buffer.from("Content-Encoding: nonce\0"), 12);

  const cipher = createCipheriv("aes-128-gcm", contentKey, nonce);
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([payload, LAST_RECORD_DELIMITER])), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(16 + 4 + 1);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(PUBLIC_KEY_BYTES, 20);
  return Buffer.concat([header, serverKeys.publicKey, encrypted]);
}
