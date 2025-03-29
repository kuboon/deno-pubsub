import { MarkdownEditor } from "./MarkdownEditor.tsx";
import { ReactionSender } from "./ReactionForm.tsx";
import { usePresentation } from "./usePresenter.tsx";
import { markdownSignal, currentPageSignal, titleSignal } from "./signals.ts";
import { setEndpoint, publishTitle, publishReaction } from "./connection.ts";

import { useEffect, useRef, useState } from "preact/hooks";

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

function Title( ) {
  return (
    <p class="my-4">
      <label class="input w-full">
        <span class="label">Title</span>
        <input
          type="text"
          class="w-full"
          value={titleSignal}
          placeholder="Enter title"
          onInput={(e) => {
            titleSignal.value = (e.target as HTMLInputElement).value;
            publishTitle();
          }}
        />
      </label>
    </p>
  );
}

export default function paramsLoader() {
  const url = new URL(location.href);
  const topicId = url.pathname.split("/").slice(-1)[0];
  const secret = url.searchParams.get("secret") || "";
  url.searchParams.delete("secret");
  const joinUrl = url.href;
  const endpoint = `${location.origin}/api/topics/${topicId}?secret=${secret}`;
  return <Presen joinUrl={joinUrl} endpoint={endpoint} />;
}

function Presen({ joinUrl, endpoint }: { joinUrl: string; endpoint: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { pages, bind } = usePresentation({
    markdown: markdownSignal.value,
    contentRef,
  });

  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);

  useEffect(() => {
    setEndpoint(endpoint);
  }, [endpoint]);

  return (
    <div id="presen" class="flex w-screen h-screen">
      <div id="left" class={`${isLeftPanelVisible ? "" : "collapse"}`}>
        <div class="p-8 w-full h-full max-w-2xl flex flex-col">
          <JoinUrl url={joinUrl} />
          <Title />
          <div class="w-full flex-grow">
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
        <div {...bind()} ref={contentRef} class="p-12 prose">
          <div
            class="presentation"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{ __html: pages[currentPageSignal.value] }}
          />
        </div>
        <ReactionSender
          onSubmit={(reaction) => {
            publishReaction(reaction);
          }}
        />
      </div>
    </div>
  );
}
