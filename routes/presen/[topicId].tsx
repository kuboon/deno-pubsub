import Presen from "../../islands/Presen.tsx";
import { Pair, verify } from "../../lib/crypto.ts";
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

type RenderParams = Pair & { title: string };

export const handler: Handlers = {
  async GET(req, ctx) {
    const topicId = ctx.params["topicId"];
    const searchParams = new URL(req.url).searchParams;
    const secret = searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }
    using kv = await Deno.openKv();
    const entry = await kv.get<{ markdown: string }>([topicId]);
    if (verified === "readable" && entry.versionstamp === null) {
      return new Response("Not found", { status: 404 });
    }
    const data = entry.value;
    const markdown = data?.markdown || "";
    const title = markdown.match(/#\s*(.+)/)?.[1] ||
      new Date().toISOString().slice(0, 10);
    return ctx.render({ topicId, secret, title });
  },
};

export default function PresenPage(props: PageProps<RenderParams>) {
  const { title } = props.data;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Presen />
    </>
  );
}
