import Terminal from "../../islands/Terminal.tsx";
import { verify } from "../../lib/crypto.ts";
import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const topicId = ctx.params.topicId;
    const searchParams = new URL(ctx.req.url).searchParams;
    const secret = searchParams.get("secret") ?? "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      throw new HttpError(404);
    }

    return {
      data: { topicId, secret },
    };
  },
});

export default define.page<typeof handler>(function TerminalPage(ctx) {
  const { topicId, secret } = ctx.data;
  const url = new URL(`/terminal/${topicId}`, ctx.url);
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
      </Head>
      <main id="terminal" class="prose m-4">
        <h1>Terminal</h1>
        {secret && <JoinUrl url={url.href} ownerUrl={ownerUrl.href} />}
        <Terminal topicId={topicId} secret={secret} />
      </main>
    </>
  );
});

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
