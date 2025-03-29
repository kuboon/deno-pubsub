import { useEffect, useRef, useState } from "preact/hooks";
import { marked } from "marked";
import { currentPageSignal, markdownSignal } from "./signals.ts";
import { publishCurrentPage } from "./connection.ts";

export function PresentationContent() {
  const [currentSection, setCurrentSection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const getPages = (content: string) => {
    const html = marked(content) as string;
    return html.split("<hr>").map((page) => page.trim());
  };

  const pages = getPages(markdownSignal.value);

  const scrollToSection = (index: number) => {
    if (!contentRef.current) return;

    const h1Elements = contentRef.current.getElementsByTagName("h1");
    if (h1Elements.length > 0) {
      h1Elements[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const bind = () => {
    let isDragging = false;

    const onPointerDown = (e: PointerEvent) => {
      const startX = e.clientX;
      const startY = e.clientY;
      isDragging = true;

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < 50) return;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0 && currentPageSignal.value > 0) {
            currentPageSignal.value -= 1;
          }
          if (deltaX < 0 && currentPageSignal.value < pages.length - 1) {
            currentPageSignal.value += 1;
          }
        }

        onPointerUp();
      };

      const onPointerUp = () => {
        isDragging = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    };

    return { onPointerDown };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentPageSignal.value > 0) {
            currentPageSignal.value -= 1;
            publishCurrentPage();
          }
          break;
        case "ArrowRight":
          if (currentPageSignal.value < pages.length - 1) {
            currentPageSignal.value += 1;
            publishCurrentPage();
          }
          break;
        case "ArrowUp":
          if (currentSection > 0) setCurrentSection((s) => s - 1);
          break;
        case "ArrowDown":
          setCurrentSection((s) => s + 1);
          break;
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [pages.length, currentSection]);

  useEffect(() => {
    setCurrentSection(0);
  }, [currentPageSignal.value]);

  useEffect(() => {
    if (currentSection >= 0) {
      scrollToSection(currentSection);
    }
  }, [currentSection]);

  return (
    <div {...bind()} ref={contentRef} class="p-12 prose">
      <div
        class="presentation"
        // deno-lint-ignore react-no-danger
        dangerouslySetInnerHTML={{ __html: pages[currentPageSignal.value] }}
      />
    </div>
  );
}
