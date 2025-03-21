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
      socket.send(JSON.stringify(ev.data));
    };

    socket.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (verified === "writable") {
        channel.postMessage(data);
      } else if ("pub" in data) {
        channel.postMessage({ pub: data.pub });
      }
    };
    return response;
  },
};
