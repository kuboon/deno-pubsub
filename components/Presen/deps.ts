export { useEffect, useRef, useState } from "preact/hooks";
export { useSignalEffect } from "@preact/signals";
export type { JSX } from "preact/jsx-runtime";

import mermaid from "mermaid/dist/mermaid.esm.mjs";
import { marked } from "marked";

import DOMPurify from "dompurify";
import markedShiki from "marked-shiki";
import { createHighlighter } from "shiki";

mermaid.initialize({ startOnLoad: false });

marked.use({
  async: true, // needed to tell marked to return a promise
  async walkTokens(token) {
    if (token.type === "code" && token.lang === "mermaid") {
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      const ret = await mermaid.render(id, token.text);
      // console.log("Rendered mermaid diagram:", token.text, ret);
      token.type = "html";
      token.text = ret.svg;
    }
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
