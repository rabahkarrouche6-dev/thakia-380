import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const DATA_ALGORITHM = "aes-256-gcm" as const;
const KEY_WRAP_ALGORITHM = "aes-256-gcm" as const;
const VERSION = 1 as const;
const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const AUTH_TAG_BYTES = 16;

export type EncryptedBidPayload = {
  version: typeof VERSION;
  algorithm: typeof DATA_ALGORITHM;
  keyVersion: string;
  nonce: string;
  ciphertext: string;
  authTag: string;
  wrappedDataKey: string;
  keyWrapNonce: string;
  keyWrapAuthTag: string;
};

function decodeMasterKey(masterKey: string): Buffer {
  if (typeof masterKey !== "string" || !masterKey.trim()) throw new Error("BID_ENCRYPTION_MASTER_KEY is required");
  const normalized = masterKey.trim();
  const key = /^[0-9a-f]{64}$/i.test(normalized)
    ? Buffer.from(normalized, "hex")
    : /^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
      ? Buffer.from(normalized, "base64")
      : Buffer.alloc(0);
  if (key.length !== KEY_BYTES) throw new Error("BID_ENCRYPTION_MASTER_KEY must decode to exactly 32 bytes");
  return key;
}

function encode(value: Buffer): string { return value.toString("base64"); }

function decode(value: string, field: string): Buffer {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const decoded = Buffer.from(value, "base64");
  if (!decoded.length) throw new Error(`${field} is invalid`);
  return decoded;
}

function assertAdditionalData(additionalData: string): Buffer {
  if (typeof additionalData !== "string" || !additionalData.trim()) throw new Error("additionalData is required");
  return Buffer.from(additionalData, "utf8");
}

function encryptWithKey(plaintext: Buffer, key: Buffer, additionalData: Buffer) {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(DATA_ALGORITHM, key, nonce);
  cipher.setAAD(additionalData);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  if (authTag.length !== AUTH_TAG_BYTES) throw new Error("Unexpected authentication tag length");
  return { nonce, ciphertext, authTag };
}

function wrapDataKey(dataKey: Buffer, masterKey: Buffer, keyVersion: string) {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(KEY_WRAP_ALGORITHM, masterKey, nonce);
  cipher.setAAD(Buffer.from(`key-wrap:${keyVersion}`, "utf8"));
  const wrappedDataKey = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const keyWrapAuthTag = cipher.getAuthTag();
  return { nonce, wrappedDataKey, keyWrapAuthTag };
}

function unwrapDataKey(encrypted: EncryptedBidPayload, masterKey: Buffer): Buffer {
  const keyWrapNonce = decode(encrypted.keyWrapNonce, "keyWrapNonce");
  const wrappedDataKey = decode(encrypted.wrappedDataKey, "wrappedDataKey");
  const keyWrapAuthTag = decode(encrypted.keyWrapAuthTag, "keyWrapAuthTag");
  if (keyWrapNonce.length !== NONCE_BYTES || keyWrapAuthTag.length !== AUTH_TAG_BYTES || wrappedDataKey.length !== KEY_BYTES) {
    throw new Error("Invalid wrapped data key parameters");
  }
  const decipher = createDecipheriv(KEY_WRAP_ALGORITHM, masterKey, keyWrapNonce);
  decipher.setAAD(Buffer.from(`key-wrap:${encrypted.keyVersion}`, "utf8"));
  decipher.setAuthTag(keyWrapAuthTag);
  const dataKey = Buffer.concat([decipher.update(wrappedDataKey), decipher.final()]);
  if (dataKey.length !== KEY_BYTES) throw new Error("Invalid unwrapped data key");
  return dataKey;
}

export function encryptBidPayload(input: {
  plaintext: string | Buffer;
  masterKey: string;
  keyVersion: string;
  additionalData: string;
}): EncryptedBidPayload {
  const masterKey = decodeMasterKey(input.masterKey);
  const keyVersion = input.keyVersion.trim();
  if (!keyVersion) throw new Error("keyVersion is required");
  const aad = assertAdditionalData(input.additionalData);
  const dataKey = randomBytes(KEY_BYTES);
  const plaintext = typeof input.plaintext === "string" ? Buffer.from(input.plaintext, "utf8") : input.plaintext;
  const payload = encryptWithKey(plaintext, dataKey, aad);
  const wrapped = wrapDataKey(dataKey, masterKey, keyVersion);
  return {
    version: VERSION,
    algorithm: DATA_ALGORITHM,
    keyVersion,
    nonce: encode(payload.nonce),
    ciphertext: encode(payload.ciphertext),
    authTag: encode(payload.authTag),
    wrappedDataKey: encode(wrapped.wrappedDataKey),
    keyWrapNonce: encode(wrapped.nonce),
    keyWrapAuthTag: encode(wrapped.keyWrapAuthTag),
  };
}

export function decryptBidPayload(input: {
  encrypted: EncryptedBidPayload;
  masterKey: string;
  additionalData: string;
}): Buffer {
  const encrypted = input.encrypted;
  if (encrypted.version !== VERSION || encrypted.algorithm !== DATA_ALGORITHM) throw new Error("Unsupported encrypted payload version or algorithm");
  const masterKey = decodeMasterKey(input.masterKey);
  const aad = assertAdditionalData(input.additionalData);
  const nonce = decode(encrypted.nonce, "nonce");
  const ciphertext = decode(encrypted.ciphertext, "ciphertext");
  const authTag = decode(encrypted.authTag, "authTag");
  if (nonce.length !== NONCE_BYTES || authTag.length !== AUTH_TAG_BYTES) throw new Error("Invalid encrypted payload parameters");
  const dataKey = unwrapDataKey(encrypted, masterKey);
  const decipher = createDecipheriv(DATA_ALGORITHM, dataKey, nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function decryptBidPayloadText(input: {
  encrypted: EncryptedBidPayload;
  masterKey: string;
  additionalData: string;
}): string {
  return decryptBidPayload(input).toString("utf8");
}
