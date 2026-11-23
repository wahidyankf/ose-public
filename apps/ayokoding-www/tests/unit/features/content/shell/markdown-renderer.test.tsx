import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "../../../../../src/features/content/shell/markdown-renderer";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("../../../../../src/features/content/shell/mermaid", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-mock="MermaidDiagram">{chart}</div>,
}));

describe("MarkdownRenderer replacements", () => {
  it("rewrites internal links to Next.js links", () => {
    render(<MarkdownRenderer html='<p><a href="/en/learn">Learn</a></p>' locale="en" />);
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("href")).toBe("/en/learn");
  });

  it("renders mermaid code blocks through the diagram component", () => {
    render(
      <MarkdownRenderer
        html={'<pre><code class="language-mermaid">flowchart LR\n  A --> B</code></pre>'}
        locale="en"
      />,
    );
    expect(screen.getByText(/flowchart LR/)).not.toBeNull();
  });
});
