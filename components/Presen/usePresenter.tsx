import { type Ref, useEffect, useState } from "preact/hooks";
import { marked } from "marked";

interface UsePresentationProps {
  markdown: string;
  contentRef: Ref<HTMLDivElement>;
}

interface UsePresentationReturn {
  currentPage: number;
  currentSection: number;
  direction: number;
  pages: string[];
  bind: () => { onPointerDown: (e: PointerEvent) => void };
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setCurrentSection: (section: number | ((prev: number) => number)) => void;
}

export function usePresentation(
  { markdown, contentRef }: UsePresentationProps,
): UsePresentationReturn {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(1);

  const getPages = (content: string) => {
    const html = marked(content) as string;
    return html.split("<hr>").map((page) => page.trim());
  };

  const pages = getPages(markdown);

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
          if (deltaX > 0 && currentPage > 0) {
            setDirection(-1);
            setCurrentPage((p) => p - 1);
          }
          if (deltaX < 0 && currentPage < pages.length - 1) {
            setDirection(1);
            setCurrentPage((p) => p + 1);
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
          if (currentPage > 0) {
            setDirection(-1);
            setCurrentPage((p) => p - 1);
          }
          break;
        case "ArrowRight":
          if (currentPage < pages.length - 1) {
            setDirection(1);
            setCurrentPage((p) => p + 1);
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
  }, [currentPage, pages.length, currentSection]);

  useEffect(() => {
    setCurrentSection(0);
  }, [currentPage]);

  useEffect(() => {
    if (currentSection >= 0) {
      scrollToSection(currentSection);
    }
  }, [currentSection]);

  return {
    currentPage,
    currentSection,
    direction,
    pages,
    bind,
    setCurrentPage,
    setCurrentSection,
  };
}
