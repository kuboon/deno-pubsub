import { MarkdownEditor } from "./MarkdownEditor.tsx";
import { PresentationContent } from "./usePresenter.tsx";
import { setEndpoint } from "./connection.ts";

import { useState } from "preact/hooks";
import ReactionFrame from "./ReactionFrame.tsx";

function JoinUrl({ url }: { url: string }) {
  return (
    <p class="my-4">
      <label class="input w-full">
        <span class="label">Join URL</span>
        <input
          id="join-url"
          type="text"
          class="w-full"
          value={url}
          readOnly
          onFocus={(e) => (e.target as HTMLInputElement).select()}
        />
      </label>
    </p>
  );
}

export default function paramsLoader() {
  const url = new URL(location.href);
  const topicId = url.pathname.split("/").slice(-1)[0];
  const secret = url.searchParams.get("secret") || "";
  const endpoint = `${location.origin}/api/topics/${topicId}?secret=${secret}`;
  setEndpoint(endpoint);

  url.searchParams.delete("secret");
  return <Presen joinUrl={url.href} publisher={!!secret} />;
}

function Presen(
  { joinUrl, publisher }: { joinUrl: string; publisher: boolean },
) {
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(publisher);

  return (
    <div id="presen" class="flex w-screen h-screen">
      <div id="left" class={`${isLeftPanelVisible ? "" : "collapse"}`}>
        <div class="p-8 w-full h-full max-w-2xl flex flex-col">
          <JoinUrl url={joinUrl} />
          <div class="flex-grow">
            <MarkdownEditor />
          </div>
        </div>
      </div>
      <div id="right" class="bg-base-100 h-screen">
        <button
          type="button"
          class="btn btn-ghost m-4"
          onClick={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        >
          {isLeftPanelVisible ? "<" : ">"}
        </button>
        <ReactionFrame>
          <PresentationContent />
        </ReactionFrame>
      </div>
    </div>
  );
}
