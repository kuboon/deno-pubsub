import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";
import { assertEquals } from "@std/assert";

type Pair = { topicId: string; secret: string };
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
  let topicIdRaw_, secretRaw_;
  try {
    topicIdRaw_ = decodeBase64Url(pair.topicId);
    secretRaw_ = decodeBase64Url(pair.secret || "");
  } catch {
    return "invalid";
  }
  const topicIdRaw = topicIdRaw_;
  const secretRaw = secretRaw_;
  const verified = await crypto.subtle.verify(
    { name: "HMAC" },
    await getHmacKey(keyStr),
    secretRaw,
    topicIdRaw,
  );
  return verified ? "writable" : "readable";
}

const algorithm = {
  name: "HMAC",
  hash: { name: "SHA-512" },
  length: 256,
};
async function generateHmacKey() {
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

Deno.test("crypto", async () => {
  const keyStr = await generateHmacKey();
  const pair = await generate(keyStr);
  const verified = await verify(pair, keyStr);
  assertEquals(verified, "writable");

  const pair2 = { topicId: pair.topicId + "a", secret: pair.secret };
  const verified2 = await verify(pair2, keyStr);
  assertEquals(verified2, "invalid");

  const pair3 = { topicId: pair.topicId, secret: pair.secret + "&" };
  const verified3 = await verify(pair3, keyStr);
  assertEquals(verified3, "invalid");

  const pair4 = { topicId: pair.topicId, secret: "" };
  const verified4 = await verify(pair4, keyStr);
  assertEquals(verified4, "readable");
});
