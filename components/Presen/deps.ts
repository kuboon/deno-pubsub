export { useEffect, useRef, useState } from "preact/hooks";
export { useSignalEffect } from "@preact/signals";
export type { JSX } from "preact/jsx-runtime";

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/+esm";
import { marked } from "marked";

import DOMPurify from "dompurify";
import markedShiki from "marked-shiki";
import { createHighlighter } from "shiki";

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

const langs = ["md", "js", "ts"];
const highlighter = await createHighlighter({
  // In this case, we include the "js" language specifier to ensure that
  // Shiki applies the appropriate syntax highlighting for Markdown code
  // blocks.
  langs,
  themes: ["min-light", "nord"],
});
marked.use(
  markedShiki({
    highlight(code, lang) {
      if (!langs.includes(lang)) return code;
      return highlighter.codeToHtml(code, {
        lang,
        themes: { light: "min-light", dark: "nord" },
      });
    },
  }),
);

const getPages = async (content: string) => {
  const html = DOMPurify.sanitize(await marked(content));
  return html.split("<hr>").map((page) => page.trim());
};
export { getPages };
