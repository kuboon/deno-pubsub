import { assertEquals, assertRejects } from "@std/assert";
import { generate, generateHmacKey, verify } from "./crypto.ts";

Deno.test("crypto operations", async (t) => {
  const keyStr = await generateHmacKey();
  const pair = await generate(keyStr);

  await t.step("verify valid pair returns writable", async () => {
    const verified = await verify(pair, keyStr);
    assertEquals(verified, "writable");
  });

  await t.step("verify tampered topicId returns invalid", async () => {
    const pair2 = { topicId: pair.topicId + "a", secret: pair.secret };
    const verified2 = await verify(pair2, keyStr);
    assertEquals(verified2, "invalid");
  });

  await t.step("verify tampered secret returns invalid", async () => {
    const pair3 = { topicId: pair.topicId, secret: pair.secret + "&" };
    const verified3 = await verify(pair3, keyStr);
    assertEquals(verified3, "invalid");
  });

  await t.step("verify empty secret returns readable", async () => {
    const pair4 = { topicId: pair.topicId, secret: "" };
    const verified4 = await verify(pair4, keyStr);
    assertEquals(verified4, "readable");
  });

  await t.step("verify invalid base64 returns invalid", async () => {
    const invalidPair = { topicId: "invalid%", secret: "secret" };
    const verified = await verify(invalidPair, keyStr);
    assertEquals(verified, "invalid");
  });
});

Deno.test("crypto - missing HMAC_KEY environment variable", async () => {
  const originalKey = Deno.env.get("HMAC_KEY");
  Deno.env.delete("HMAC_KEY");

  try {
    await assertRejects(
      async () => {
        await generate();
      },
      Error,
      "HMAC_KEY not set",
    );

    await assertRejects(
      async () => {
        // Use valid base64 strings to pass the decoding check
        // "dGVzdA" is "test" in base64url (no padding needed usually)
        const pair = { topicId: "dGVzdA", secret: "dGVzdA" };
        await verify(pair);
      },
      Error,
      "HMAC_KEY not set",
    );
  } finally {
    if (originalKey) {
      Deno.env.set("HMAC_KEY", originalKey);
    }
  }
});
