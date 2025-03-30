import { useEffect, useRef } from "preact/hooks";
import { marked } from "marked";
import {
  currentPageSignal,
  currentSectionSignal,
  effect,
  markdownSignal,
} from "./signals.ts";
import { publishCurrentPage, publishCurrentSection } from "./connection.ts";

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
    currentPageSignal.value += 1;
    publishCurrentPage();
  },
  left() {
    if (currentPageSignal.value > 0) {
      currentPageSignal.value -= 1;
      publishCurrentPage();
    }
  },
  down() {
    currentSectionSignal.value += 1;
    publishCurrentSection();
  },
  up() {
    if (currentSectionSignal.value > 0) {
      currentSectionSignal.value -= 1;
      publishCurrentSection();
    }
  },
};

export function PresentationContent() {
  const contentRef = useRef<HTMLDivElement>(null);

  const pages = getPages(markdownSignal.value);
  const __html = pages[currentPageSignal.value];
  useEffect(() => {
    if (contentRef.current) {
      mermaid.run();
    }
  }, [__html]);
  useEffect(() => {
    if (currentPageSignal.value >= pages.length) {
      currentPageSignal.value = pages.length - 1;
    }
  }, [currentPageSignal.value, pages.length]);

  const bind = () => {
    let swiping = false;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          control.left();
          break;
        case "ArrowRight":
          control.right();
          break;
        case "ArrowUp":
          control.up();
          break;
        case "ArrowDown":
          control.down();
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
          if (deltaX < 0 && currentPageSignal.value < pages.length - 1) {
            control.right();
          }
        } else {
          if (deltaY > 0) {
            control.down();
          }
          if (deltaY < 0) control.up();
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

    return { onKeyDown, tabIndex: -1, onPointerDown };
  };

  effect(() => {
    if (!contentRef.current) return;
    const h1Elements = contentRef.current.getElementsByTagName("h1");
    const target = h1Elements[currentSectionSignal.value];
    if (!target) {
      currentSectionSignal.value = h1Elements.length - 1;
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    [...h1Elements].forEach((h1) => {
      h1.classList.remove("current-section");
    });
    target.classList.add("current-section");
  });

  return (
    <div
      {...bind()}
      ref={contentRef}
      class="presentation p-8 prose"
      // deno-lint-ignore react-no-danger
      dangerouslySetInnerHTML={{ __html }}
    />
  );
}
