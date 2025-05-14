import { publishCurrentPage, publishCurrentSection } from "./connection.ts";
import {
  currentPageRanged,
  currentSectionRanged,
  markdownSignal,
  pagesSignal
} from "./signals.ts";
import { getPages, useRef, useSignalEffect } from "./deps.ts";

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

export function PresentationContent({ publisher }: { publisher: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useSignalEffect(() => {
    getPages(markdownSignal.value).then((pages_) => {
      pagesSignal.value = pages_;
      currentPageRanged.max.value = pages_.length - 1;
    });
  });
  useSignalEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = pagesSignal.value[currentPageRanged.value];
    const h1Elements = contentRef.current.getElementsByTagName("h1");
    currentSectionRanged.max.value = h1Elements.length - 1;
  });

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
          if (publisher) control.down();
          break;
        case "ArrowUp":
          if (publisher) control.up();
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
      if (!publisher) return;
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
      <div ref={contentRef} class="presentation p-8 prose" />
    </div>
  );
}
