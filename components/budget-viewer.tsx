"use client";

import { useLayoutEffect, useRef, useState } from "react";

export const DOC_WIDTH = 800;

/**
 * Prints only the document as one tall page the size of the budget,
 * like the PDFs exported so far. Chrome: "Save as PDF".
 */
export function printBudgetDocument(container: HTMLElement | null, fileName: string) {
  const doc = container?.querySelector<HTMLElement>(".budget-document");
  if (!doc) return;

  const style = document.createElement("style");
  style.textContent = `@page { size: ${doc.offsetWidth}px ${doc.offsetHeight + 2}px; margin: 0; }`;
  document.head.appendChild(style);
  const previousTitle = document.title;
  document.title = fileName;

  const restore = () => {
    style.remove();
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

/**
 * Shrinks the 800px document to a fixed scale, or to fit the available width
 * (never larger than 1). Full size when printing (see globals.css).
 */
export function ScaledBudget({
  scale: fixedScale,
  className = "",
  children,
}: {
  scale?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [fitScale, setFitScale] = useState(1);
  const scale = fixedScale ?? fitScale;

  useLayoutEffect(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;
    const observer = new ResizeObserver(() => {
      setHeight(inner.offsetHeight);
      const available = outer.parentElement?.clientWidth ?? DOC_WIDTH;
      setFitScale(Math.min(1, available / DOC_WIDTH));
    });
    observer.observe(inner);
    if (outer.parentElement) observer.observe(outer.parentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className={`budget-preview overflow-hidden ${className}`}
      style={{ width: DOC_WIDTH * scale, height: height * scale }}
    >
      <div
        ref={innerRef}
        className="budget-preview-inner"
        style={{ width: DOC_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
