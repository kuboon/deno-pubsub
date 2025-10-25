import Presen from "../../islands/Presen.tsx";
import { Pair, verify } from "../../lib/crypto.ts";
import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "../../utils.ts";

type RenderParams = Pair & { title: string };

export const handler = define.handlers({
  async GET(ctx) {
    const topicId = ctx.params.topicId;
    const searchParams = new URL(ctx.req.url).searchParams;
    const secret = searchParams.get("secret") ?? "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      throw new HttpError(404);
    }
    using kv = await Deno.openKv();
    const entry = await kv.get<{ markdown: string }>([topicId]);
    if (verified === "readable" && entry.versionstamp === null) {
      throw new HttpError(404);
    }
    const data = entry.value;
    const markdown = data?.markdown || "";
    const title = markdown.match(/#\s*(.+)/)?.[1] ||
      new Date().toISOString().slice(0, 10);
    return {
      data: { topicId, secret, title },
    };
  },
});

export default define.page<typeof handler>(function PresenPage(ctx) {
  const { title } = ctx.data;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Presen />
    </>
  );
});
