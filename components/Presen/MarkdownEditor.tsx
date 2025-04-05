import { markdownSignal } from "./signals.ts";
import { publishMarkdown } from "./connection.ts";
import { useRef, useState } from "./deps.ts";

export function MarkdownEditor({ publisher }: { publisher: boolean }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [locked, setLocked] = useState(false);
  const updateMarkdown = () => {
    if (textRef.current) {
      markdownSignal.value = textRef.current.value;
      publishMarkdown();
    }
  };

  return (
    <>
      <textarea
        ref={textRef}
        class="textarea textarea-bordered flex-grow w-full"
        value={markdownSignal}
        readOnly={!publisher}
        onInput={() => (locked && updateMarkdown())}
        placeholder="Edit your markdown here..."
      >
      </textarea>
      {publisher && (
        <div class="flex place-content-end gap-4">
          <label class="fieldset-label">
            auto save
            <input
              type="checkbox"
              class="toggle"
              onChange={(e) => setLocked(e.currentTarget.checked)}
            />
          </label>
          <button
            type="button"
            class="btn btn-primary"
            disabled={locked}
            onClick={() => updateMarkdown()}
          >
            Save
          </button>
        </div>
      )}
    </>
  );
}
