/// <reference lib="deno.unstable" />
import { verify } from "../../../lib/crypto.ts";
import { define } from "../../../utils.ts";

const expireIn = 7 * 24 * 60 * 60 * 1000; // 7 days
export const handler = define.handlers({
  async POST(ctx) {
    const topicId = ctx.params.topicId;
    const secret = new URL(ctx.req.url).searchParams.get("secret") ?? "";
    const verified = await verify({ topicId, secret });
    if (verified !== "writable") {
      return new Response("Invalid secret", { status: 403 });
    }

    const body = await ctx.req.json();
    using kv = await Deno.openKv();
    await kv.set([topicId], body, { expireIn });
    return new Response(null, { status: 201 });
  },
  async GET(ctx) {
    const topicId = ctx.params.topicId;
    const secret = new URL(ctx.req.url).searchParams.get("secret") ?? "";
    const verified = await verify({ topicId, secret });
    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }
    if (ctx.req.headers.get("upgrade") !== "websocket") {
      using kv = await Deno.openKv();
      const entry = await kv.get([topicId]);
      if (entry.versionstamp === null) {
        return new Response("Not found", { status: 404 });
      }
      return Response.json(entry.value);
    }
    const { socket, response } = Deno.upgradeWebSocket(ctx.req);
    const uuid = crypto.randomUUID();
    const channel = new BroadcastChannel(topicId);
    socket.onclose = () => {
      channel.close();
    };
    channel.onmessage = (ev) => {
      socket.send(JSON.stringify(ev.data));
    };
    socket.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (verified === "writable") {
        channel.postMessage(data);
      } else if ("pub" in data) {
        channel.postMessage({ uuid, pub: data.pub });
      }
    };
    return response;
  },
});
