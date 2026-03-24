import { describe, it, expect } from "vitest";
import { parseMarkdown } from "@/server/content/parser";

describe("parseMarkdown", () => {
  it("renders fenced code blocks with rehype-pretty-code figure wrapper", async () => {
    const md = '```go\nfmt.Println("hello")\n```';
    const { html } = await parseMarkdown(md);

    // rehype-pretty-code wraps code in <figure data-rehype-pretty-code-figure>
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-language="go"');
  });

  it("applies shiki dual-theme CSS variables to code tokens", async () => {
    const md = '```go\npackage main\n```';
    const { html } = await parseMarkdown(md);

    // Shiki dual-theme generates --shiki-light and --shiki-dark CSS vars
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
  });

  it("preserves mermaid code blocks with data-language attribute", async () => {
    const md = '```mermaid\ngraph LR\n  A --> B\n```';
    const { html } = await parseMarkdown(md);

    // Mermaid blocks should have data-language="mermaid" for client-side detection
    expect(html).toContain('data-language="mermaid"');
    expect(html).toContain("graph LR");
  });

  it("extracts H2-H4 headings for table of contents", async () => {
    const md = "## Heading Two\n### Heading Three\n#### Heading Four\n##### Heading Five";
    const { headings } = await parseMarkdown(md);

    expect(headings).toHaveLength(3); // H5 excluded
    expect(headings[0]).toMatchObject({ text: "Heading Two", level: 2 });
    expect(headings[1]).toMatchObject({ text: "Heading Three", level: 3 });
    expect(headings[2]).toMatchObject({ text: "Heading Four", level: 4 });
  });

  it("adds id attributes to headings via rehype-slug", async () => {
    const md = "## Getting Started";
    const { html } = await parseMarkdown(md);

    expect(html).toContain('id="getting-started"');
  });

  it("renders inline math with KaTeX", async () => {
    const md = "The formula $E = mc^2$ is famous.";
    const { html } = await parseMarkdown(md);

    // rehype-katex produces katex class elements
    expect(html).toContain("katex");
  });

  it("renders GFM tables", async () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const { html } = await parseMarkdown(md);

    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("transforms Hugo shortcodes before parsing", async () => {
    const md = '{{< callout type="info" >}}Important note{{< /callout >}}';
    const { html } = await parseMarkdown(md);

    expect(html).toContain('data-callout="info"');
    expect(html).toContain("Important note");
  });
});
