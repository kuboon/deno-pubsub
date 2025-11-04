import { define } from "../../utils.ts";

export const handler = define.handlers((c) => {
  const origin = new URL(c.req.url).origin;
  return new Response(
    `usage:
    deno run -A ${origin}/cli`,
    { headers: { "Content-Type": "text/plain" } },
  );
});
