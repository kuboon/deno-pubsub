import { define } from "../../utils.ts";

export const handler = define.middleware(async (ctx) => {
  const { req } = ctx;
  if (req.headers.get("Upgrade") === "websocket") {
    return ctx.next();
  }
  const isPreflight = req.method === "OPTIONS";
  const cors = {
    Origin: "*",
    Headers: "Content-Type",
  };

  const resp = isPreflight
    ? new Response(null, { status: 204 })
    : await ctx.next();
  for (const [key, value] of Object.entries(cors)) {
    resp.headers.set(`Access-Control-Allow-${key}`, value);
  }
  return resp;
});
