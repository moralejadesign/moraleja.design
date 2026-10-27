"use client";

import { useLayoutEffect, useRef, useState } from "react";

export const DOC_WIDTH = 800;

/**
 * Prints only the document as a single page exactly its size, however tall,
 * like the PDFs exported so far. Chrome: "Save as PDF".
 *
 * The document is copied into a hidden iframe with the page's styles, so
 * nothing else on the admin page can add height and spill onto a second page.
 */
export async function printBudgetDocument(container: HTMLElement | null, fileName: string) {
  const doc = container?.querySelector<HTMLElement>(".budget-document");
  if (!doc) return;

  const styles = [...document.head.querySelectorAll('link[rel="stylesheet"], style')]
    .map((el) => el.outerHTML)
    .join("");

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${DOC_WIDTH}px;height:100px;border:0;`;
  // Font variables (next/font) hang off the html and body classes
  frame.srcdoc = `<!doctype html><html class="${document.documentElement.className}"><head><base href="${location.origin}/"><title>${fileName}</title>${styles}</head><body class="${document.body.className}" style="margin:0;background:#0a0a0a">${doc.outerHTML}</body></html>`;

  await new Promise((resolve) => {
    frame.onload = resolve;
    document.body.appendChild(frame);
  });

  const win = frame.contentWindow;
  const frameDoc = frame.contentDocument;
  const printed = frameDoc?.querySelector<HTMLElement>(".budget-document");
  if (!win || !frameDoc || !printed) {
    frame.remove();
    return;
  }

  // Wait for the brand fonts and SVGs so the measured height is final
  await frameDoc.fonts.ready;
  await Promise.all(
    [...frameDoc.images].map((img) => (img.complete ? null : img.decode().catch(() => null)))
  );

  const height = Math.ceil(printed.getBoundingClientRect().height);
  const page = frameDoc.createElement("style");
  page.textContent = `@page { size: ${DOC_WIDTH}px ${height}px; margin: 0; }
    html, body { width: ${DOC_WIDTH}px; height: ${height}px; overflow: hidden; }`;
  frameDoc.head.appendChild(page);

  // Chrome names the PDF after the top page's title
  const previousTitle = document.title;
  document.title = fileName;
  const cleanup = () => {
    document.title = previousTitle;
    frame.remove();
  };
  win.addEventListener("afterprint", () => setTimeout(cleanup, 0), { once: true });
  win.focus();
  win.print();
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
