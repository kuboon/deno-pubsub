import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";

export type Pair = { topicId: string; secret: string };
export async function generate(
  keyStr = Deno.env.get("HMAC_KEY"),
): Promise<Pair> {
  const topicIdRaw = new Uint8Array(12);
  crypto.getRandomValues(topicIdRaw);
  const secretRaw = await crypto.subtle.sign(
    { name: "HMAC" },
    await getHmacKey(keyStr),
    topicIdRaw,
  );

  const topicId = encodeBase64Url(topicIdRaw);
  const secret = encodeBase64Url(secretRaw);
  return { topicId, secret };
}
export async function verify(
  pair: Pair,
  keyStr = Deno.env.get("HMAC_KEY"),
): Promise<"invalid" | "readable" | "writable"> {
  let topicIdRaw, secretRaw;
  try {
    topicIdRaw = decodeBase64Url(pair.topicId);
    secretRaw = decodeBase64Url(pair.secret || "");
  } catch {
    return "invalid";
  }
  if (!pair.secret) return "readable";
  const verified = await crypto.subtle.verify(
    { name: "HMAC" },
    await getHmacKey(keyStr),
    secretRaw,
    topicIdRaw,
  );
  return verified ? "writable" : "invalid";
}

const algorithm = {
  name: "HMAC",
  hash: { name: "SHA-512" },
  length: 256,
};
export async function generateHmacKey() {
  const key = await crypto.subtle.generateKey(
    algorithm,
    true,
    ["sign", "verify"],
  );
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  return encodeBase64Url(exportedKey);
}
async function getHmacKey(str = Deno.env.get("HMAC_KEY")) {
  if (!str) {
    throw new Error("HMAC_KEY not set");
  }
  const decoded = decodeBase64Url(str);
  const key = await crypto.subtle.importKey(
    "raw",
    decoded,
    algorithm,
    false,
    ["sign", "verify"],
  );
  return key;
}

if (import.meta.main) {
  const key = await generateHmacKey();
  console.log(`HMAC_KEY=${key}`);
}
