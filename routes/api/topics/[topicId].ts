/// <reference lib="deno.unstable" />
import { Handlers } from "$fresh/server.ts";
import { verify } from "../../../lib/crypto.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const topicId = ctx.params["topicId"];
    const secret = new URL(req.url).searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });
    if (verified !== "writable") {
      return new Response("Invalid secret", { status: 403 });
    }

    const body = await req.json();
    const kv = await Deno.openKv();
    await kv.set([topicId], body, { expireIn: 7 * 24 * 60 * 60 * 1000 });
    return new Response(null, { status: 201 });
  },
  async GET(req, ctx) {
    const topicId = ctx.params["topicId"];
    const secret = new URL(req.url).searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });
    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }
    if (req.headers.get("upgrade") !== "websocket") {
      const kv = await Deno.openKv();
      const entry = await kv.get([topicId]);
      if (entry.versionstamp === null) {
        return new Response("Not found", { status: 404 });
      }
      return Response.json(entry.value);
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
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
};
