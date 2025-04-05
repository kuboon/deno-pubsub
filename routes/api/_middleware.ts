import { FreshContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  if(req.headers.get("Upgrade") === "websocket") {
    return ctx.next();
  }
  const isPreflight = req.method == "OPTIONS";
  const cors = {
    Origin: "*",
    Headers: "Content-Type",
  };

  const resp = isPreflight
    ? new Response(null, { status: 204 })
    : await ctx.next();
  // const headers = new Headers(resp.headers);
  for (const [key, value] of Object.entries(cors)) {
    resp.headers.set(`Access-Control-Allow-${key}`, value);
  }
  return resp;//new Response(resp.body, { ...resp, headers });
}
