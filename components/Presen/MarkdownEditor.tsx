import { markdownSignal } from "./signals.ts";

export function MarkdownEditor() {
  return (
    <textarea
      class="textarea textarea-bordered w-full h-full"
      value={markdownSignal}
      onInput={(e) => (markdownSignal.value = e.currentTarget.value)}
      placeholder="Edit your markdown here..."
    >
    </textarea>
  );
}
