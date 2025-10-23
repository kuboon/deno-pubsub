import Terminal from "../../islands/Terminal.tsx";
import { Pair, verify } from "../../lib/crypto.ts";
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const topicId = ctx.params["topicId"];
    const searchParams = new URL(req.url).searchParams;
    const secret = searchParams.get("secret") || "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      return new Response("Not Found", { status: 404 });
    }

    return ctx.render({ topicId, secret });
  },
};

export default function TerminalPage(props: PageProps<Pair>) {
  const { topicId, secret } = props.data;
  const url = new URL(`/terminal/${topicId}`, props.url);
  const ownerUrl = new URL(url.href);
  if (secret) {
    ownerUrl.searchParams.set("secret", secret);
  }

  return (
    <>
      <Head>
        <title>Terminal</title>
        <link
          rel="stylesheet"
          href="https://esm.sh/xterm@5.3.0/css/xterm.css"
        />
        <link rel="stylesheet" href="/terminal.css" />
      </Head>
      <main id="terminal" class="prose m-4">
        <h1>Terminal</h1>
        {secret && <JoinUrl url={url.href} ownerUrl={ownerUrl.href} />}
        <Terminal topicId={topicId} secret={secret} />
      </main>
    </>
  );
}

function JoinUrl({ url, ownerUrl }: { url: string; ownerUrl: string }) {
  return (
    <section class="join-info">
      <p>
        <label class="input w-2xl">
          <span class="label">Share this URL</span>
          <input type="text" class="w-full" value={url} readonly />
        </label>
      </p>
      <p class="text-sm text-gray-500">
        管理者用 URL: <a href={ownerUrl}>{ownerUrl}</a>
      </p>
    </section>
  );
}
