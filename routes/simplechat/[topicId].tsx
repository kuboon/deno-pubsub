import { Handlers, PageProps } from "$fresh/server.ts";
import SimpleChat from "../../islands/SimpleChat.tsx";
import { Pair, verify } from "../../lib/crypto.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const topicId = ctx.params["topicId"];
    const secret = new URL(req.url).searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }
    return ctx.render({ topicId, secret });
  },
};

export default function SimpleChatPage(props: PageProps<Pair>) {
  const { topicId, secret } = props.data;
  const url = new URL(`/simplechat/${topicId}`, props.url);
  return (
    <main id="simplechat">
      <h1>SimpleChat</h1>
      <p class="my-4">
        <label class="input w-2xl">
          <span class="label">Join URL</span>
          <input id="join-url" type="text" class="w-full" value={url.href} readonly></input>
        </label>
      </p>
      <SimpleChat topicId={topicId} secret={secret} />
    </main>
  );
}
