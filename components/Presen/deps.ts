export { useEffect, useRef, useState } from "preact/hooks";
export { useSignalEffect } from "@preact/signals";
export type { JSX } from "preact/jsx-runtime";

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/+esm";
import { marked } from "marked";

mermaid.initialize({ startOnLoad: false });

marked.use({
  renderer: {
    code: function (code) {
      if (code.lang == "mermaid") {
        return `<pre class="mermaid">${code.text}</pre>`;
      }
      return `<pre><code>${code.text}</code></pre>`;
    },
  },
});
export { marked, mermaid };
