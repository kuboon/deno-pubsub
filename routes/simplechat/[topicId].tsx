import { HttpError, PageProps } from "fresh";
import SimpleChat from "../../islands/SimpleChat.tsx";
import { verify } from "../../lib/crypto.ts";

export default async function SimpleChatPage(props: PageProps) {
  const topicId = props.params["topicId"];
  const url = new URL(props.url);
  const secret = url.searchParams.get("secret") || "";
  const verified = await verify({ topicId, secret });

  if (verified === "invalid") {
    throw new HttpError(404);
  }

  const joinUrl = new URL(`/simplechat/${topicId}`, props.url).href;

  return (
    <main id="simplechat">
      <h1>SimpleChat</h1>
      {secret && <JoinUrl url={joinUrl} />}
      <SimpleChat topicId={topicId} secret={secret} />
    </main>
  );
}

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
