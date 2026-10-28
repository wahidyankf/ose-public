"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

/**
 * One fenced `mermaid` block, rendered as a diagram (plan ayokoding-learn-revamp-04, S8).
 *
 * The chart's own source is both the fallback the served page carries and the block's size: it
 * stays in the layout — hidden only once the diagram exists — and the rendered SVG is fitted into
 * that reserved box. Mermaid can only draw in a browser, so before it does, the source is the block
 * and after it does, the box is unchanged: hydration never resizes the block, and the lesson's
 * progress controls below it never move (S8's "progress appears without moving the page").
 */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
      });

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.warn("[mermaid] Failed to render diagram:", err);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div ref={containerRef} className="relative">
      <pre
        // Exposed source can scroll while rendering is pending or fails; WCAG 2.1.1 needs keyboard access.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={svg === "" ? 0 : -1}
        // The keyboard focus indicator is the foreground token, offset from the source: the browser default is 2.70:1
        // in WebKit against the code surface (DWT-006), and the ring token is below 3:1 in dark (DWT-002).
        className={
          svg === ""
            ? "my-4 rounded bg-muted p-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            : "invisible my-4 rounded bg-muted p-4 text-sm"
        }
      >
        <code>{chart}</code>
      </pre>
      {svg === "" ? null : (
        <div
          // `inset-4` matches the reserved box's own padding, so the diagram sits where the source
          // did. `h-full w-auto` + `max-w-full` fit the SVG's viewBox into that box at its own
          // aspect ratio, whatever size the chart is.
          className="absolute inset-4 flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
