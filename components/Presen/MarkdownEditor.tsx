import { useRef, useState } from "preact/hooks";
import { markdownSignal } from "./signals.ts";
import { publishMarkdown } from "./connection.ts";

export function MarkdownEditor() {
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
        class="textarea textarea-bordered w-full h-full"
        value={markdownSignal}
        onInput={() => (locked && updateMarkdown())}
        placeholder="Edit your markdown here..."
      >
      </textarea>
      <div class="flex place-content-end">
        <label class="fieldset-label">
          Lock
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
    </>
  );
}
