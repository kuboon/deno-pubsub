import type { Pair } from "../../lib/crypto.ts";
import { MarkdownEditor, markdownSignal } from "./MarkdownEditor.tsx";
import { ReactionSender } from "./ReactionForm.tsx";
import { usePresentation } from "./usePresenter.tsx";

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

function Title(
  { value, onChange }: { value: string; onChange: (value: string) => void },
) {
  return (
    <p class="my-4">
      <label class="input w-full">
        <span class="label">Title</span>
        <input
          type="text"
          class="w-full"
          value={value}
          placeholder="Enter title"
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
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
  return <Presen topicId={topicId} secret={secret} />;
}

function Presen({ topicId, secret }: Pair) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { pages, currentPage, currentSection, bind } = usePresentation({
    markdown: markdownSignal.value,
    contentRef,
  });

  const [wsSignal, setWsSignal] = useState<WebSocket | undefined>(undefined);
  const [reactionsSignal, setReactionsSignal] = useState<
    { reaction: string; timestamp: Date }[]
  >([]);
  const [title, setTitle] = useState("");
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);

  useEffect(() => {
    if (wsSignal && wsSignal.readyState === WebSocket.OPEN) return;

    const ws_ = new WebSocket(`/api/topics/${topicId}?secret=${secret}`);
    setWsSignal(ws_);

    ws_.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.reaction) {
        setReactionsSignal((prev) => [
          ...prev,
          { reaction: data.reaction, timestamp: new Date() },
        ]);
      }
    });

    ws_.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };

    return () => {
      ws_.close();
    };
  }, []);

  useEffect(() => {
    if (wsSignal) {
      wsSignal.send(JSON.stringify({ currentPage, currentSection }));
    }
  }, [currentPage, currentSection]);

  return (
    <div id="presen" class="flex w-screen h-screen">
      <div id="left" class={`${isLeftPanelVisible ? "" : "collapse"}`}>
        <div class="p-8 w-full max-w-2xl">
          <JoinUrl url={`${location.origin}/presen/${topicId}`} />
          <Title value={title} onChange={setTitle} />
          <div class="w-full">
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
            dangerouslySetInnerHTML={{ __html: pages[currentPage] }}
          />
          <div class="reactions">
            {reactionsSignal.map((reaction, index) => (
              <div key={index} class="badge badge-accent m-1">
                {reaction.reaction}
              </div>
            ))}
          </div>
        </div>
        <ReactionSender
          onSubmit={(reaction) => {
            if (wsSignal && wsSignal.readyState === WebSocket.OPEN) {
              wsSignal.send(JSON.stringify({ reaction }));
            }
          }}
        />
      </div>
    </div>
  );
}
