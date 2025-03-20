import { Handlers } from "$fresh/server.ts";
import { verify } from "../../../lib/crypto.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }
    const topicId = ctx.params["topicId"];
    const secret = new URL(req.url).searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });
    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const channel = new BroadcastChannel(topicId);
    socket.onclose = () => {
      channel.close();
    };
    channel.onmessage = (ev) => {
      socket.send(ev.data);
    };

    socket.onmessage = (ev) => {
      if (verified === "writable") {
        channel.postMessage(ev.data);
      } else if ("pub" in ev.data) {
        channel.postMessage({ pub: ev.data.pub });
      }
    };
    return response;
  },
};
