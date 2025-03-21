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
  const inputTag =
    `<input type="text" class="input" value="${url.href}" readonly onfocus="this.select();"></input>`;
  // deno-lint-ignore react-no-danger
  const span = <span dangerouslySetInnerHTML={{ __html: inputTag }} />;
  return (
    <main id="simplechat">
      <h1>SimpleChat</h1>
      <p>Join URL: {span}</p>
      <SimpleChat topicId={topicId} secret={secret} />
    </main>
  );
}
