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
    const title = searchParams.get("title") || new Date().toLocaleDateString();
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
