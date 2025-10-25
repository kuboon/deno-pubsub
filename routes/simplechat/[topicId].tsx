import { HttpError } from "fresh";
import SimpleChat from "../../islands/SimpleChat.tsx";
import { verify } from "../../lib/crypto.ts";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const topicId = ctx.params.topicId;
    const secret = new URL(ctx.req.url).searchParams.get("secret") ?? "";
    const verified = await verify({ topicId, secret });

    if (verified === "invalid") {
      throw new HttpError(404);
    }
    return {
      data: { topicId, secret },
    };
  },
});

export default define.page<typeof handler>(function SimpleChatPage(ctx) {
  const { topicId, secret } = ctx.data;
  const url = new URL(`/simplechat/${topicId}`, ctx.url);
  return (
    <main id="simplechat">
      <h1>SimpleChat</h1>
      {secret && <JoinUrl url={url.href} />}
      <SimpleChat topicId={topicId} secret={secret} />
    </main>
  );
});

function JoinUrl({ url }: { url: string }) {
  return (
    <p class="my-4">
      <label class="input w-2xl">
        <span class="label">Join URL</span>
        <input id="join-url" type="text" class="w-full" value={url} readonly />
      </label>
    </p>
  );
}
