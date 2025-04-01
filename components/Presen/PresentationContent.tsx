import { publishCurrentPage, publishCurrentSection } from "./connection.ts";
import { marked } from "marked";
import {
  currentPageRanged,
  currentSectionRanged,
  markdownSignal,
} from "./signals.ts";
import { useEffect, useRef } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";

import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/+esm";
mermaid.initialize({ startOnLoad: false });

marked.use({
  renderer: {
    code: function (code) {
      if (code.lang == "mermaid") {
        return `<pre class="mermaid">${code.text}</pre>`;
      }
      return `<pre>${code.text}</pre>`;
    },
  },
});

const getPages = (content: string) => {
  const html = marked(content) as string;
  return html.split("<hr>").map((page) => page.trim());
};

const control = {
  right() {
    currentPageRanged.update((val) => val + 1);
    publishCurrentPage();
  },
  left() {
    currentPageRanged.update((val) => val - 1);
    publishCurrentPage();
  },
  down() {
    currentSectionRanged.update((val) => val + 1);
    publishCurrentSection();
  },
  up() {
    currentSectionRanged.update((val) => val - 1);
    publishCurrentSection();
  },
  scrollTo(val: number) {
    currentSectionRanged.value = val;
    publishCurrentSection();
  },
};

function delay(fn: (...args: unknown[]) => void, ms: number) {
  let timeoutId: number;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, ms, ...args);
  };
}

export function PresentationContent() {
  const contentRef = useRef<HTMLDivElement>(null);

  const pages = getPages(markdownSignal.value);
  const __html = pages[currentPageRanged.value];
  useEffect(() => {
    if (!contentRef.current) return;
    const h1Elements = contentRef.current.getElementsByTagName("h1");
    currentSectionRanged.max.value = h1Elements.length - 1;
    mermaid.run();
  }, [contentRef, __html]);

  useSignalEffect(() => {
    const currentSection = currentSectionRanged.value;
    if (!contentRef.current) return;
    const h1Elements = contentRef.current.getElementsByTagName("h1");
    const target = h1Elements[currentSection];
    if (!target) return;

    [...h1Elements].forEach((h1) => {
      h1.classList.remove("current-section");
    });
    target.classList.add("current-section");

    delay(
      () => target.scrollIntoView({ behavior: "smooth", block: "start" }),
      1,
    )();
  });

  currentPageRanged.max.value = pages.length - 1;

  const bind = () => {
    let swiping = false;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          control.right();
          break;
        case "ArrowLeft":
          control.left();
          break;
        case "ArrowDown":
          control.down();
          break;
        case "ArrowUp":
          control.up();
          break;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const startX = e.clientX;
      const startY = e.clientY;
      swiping = true;

      const onPointerMove = (e: PointerEvent) => {
        if (!swiping) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < 50) return;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) control.left();
          if (deltaX < 0) control.right();
        }

        removeListeners();
      };

      const removeListeners = () => {
        swiping = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", removeListeners);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", removeListeners);
    };

    const onScroll = () => {
      if (!contentRef.current) return;
      const h1Elements = contentRef.current.getElementsByTagName("h1");
      if (h1Elements.length === 0) return;
      for (let i = 0; i < h1Elements.length; i++) {
        const rect = h1Elements[i].getBoundingClientRect();
        if (0 <= rect.top) {
          control.scrollTo(i);
          return;
        }
      }
    };

    return {
      onKeyDown,
      tabIndex: -1,
      onPointerDown,
      onScroll: delay(onScroll, 100),
    };
  };

  return (
    <div {...bind()} class="overflow-y-auto h-full w-full">
      <div
        ref={contentRef}
        class="presentation p-8 prose"
        // deno-lint-ignore react-no-danger
        dangerouslySetInnerHTML={{ __html }}
      />
    </div>
  );
}
