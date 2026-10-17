import { describe, it, expect } from "vitest";
import { parseMarkdown } from "@/features/content/core/parser";

describe("parseMarkdown", () => {
  it("renders fenced code blocks with rehype-pretty-code figure wrapper", async () => {
    const md = '```go\nfmt.Println("hello")\n```';
    const { html } = await parseMarkdown(md);

    // rehype-pretty-code wraps code in <figure data-rehype-pretty-code-figure>
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-language="go"');
  });

  it("applies shiki dual-theme CSS variables to code tokens", async () => {
    const md = "```go\npackage main\n```";
    const { html } = await parseMarkdown(md);

    // Shiki dual-theme generates --shiki-light and --shiki-dark CSS vars
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
  });

  it("preserves mermaid code blocks with data-language attribute", async () => {
    const md = "```mermaid\ngraph LR\n  A --> B\n```";
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

  it("maps the first body heading level to h2 so the body never skips a level (UIW-004)", async () => {
    const md = "### Section One\n#### Detail\n### Section Two";
    const { html, headings } = await parseMarkdown(md);

    expect(html).toContain("<h2");
    // The nested `#### Detail` shifts with its parent (h2 > h3: no skip).
    expect(html).toContain("<h3");
    expect(html).not.toContain("<h4");
    expect(headings).toMatchObject([
      { text: "Section One", level: 2 },
      { text: "Detail", level: 3 },
      { text: "Section Two", level: 2 },
    ]);
  });

  it("leaves a body that already starts at h2 untouched", async () => {
    const md = "## Top\n### Sub";
    const { html, headings } = await parseMarkdown(md);

    expect(html).toContain("<h2");
    expect(html).toContain("<h3");
    expect(headings).toMatchObject([
      { text: "Top", level: 2 },
      { text: "Sub", level: 3 },
    ]);
  });

  it("demotes a leading body h1 to h2 so the page title keeps the only h1 (EWT-002)", async () => {
    const md = "# Beginner Elixir\n\nRun every source file.\n\n## Example 01\n\n## Example 02";
    const { html, headings } = await parseMarkdown(md);

    expect(html).not.toContain("<h1");
    // Shifted by the same delta (+1), so nesting is preserved: h1 → h2, h2 → h3.
    expect(headings).toMatchObject([
      { text: "Beginner Elixir", level: 2 },
      { text: "Example 01", level: 3 },
      { text: "Example 02", level: 3 },
    ]);
  });

  it("shifts from the first body heading when a trailing h2 follows h3 sections (EWT-003)", async () => {
    const md = "### Example 1\n\n### Example 2\n\n## References";
    const { html, headings } = await parseMarkdown(md);

    expect(html).not.toContain("<h3");
    expect(html).not.toContain("<h1");
    expect(headings).toMatchObject([
      { text: "Example 1", level: 2 },
      { text: "Example 2", level: 2 },
      { text: "References", level: 2 },
    ]);
  });

  it("clamps shifted levels at h6 instead of producing h7+", async () => {
    const md = "# Title\n\n###### Deep";
    const { html } = await parseMarkdown(md);

    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2");
    expect(html).toContain("<h6");
    expect(html).not.toMatch(/<h[7-9]/);
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

  describe("in-body relative content links", () => {
    const currentSlug = "learn/fundamentally-strong/software-engineer/just-enough-nvim/learning/overview";

    it("rewrites a relative link that climbs directories to the linked page's real site route", async () => {
      const md = "[Overview (section)](../../overview.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/overview"');
      expect(html).not.toContain(".md");
    });

    it("rewrites a same-directory relative link to the linked page's real site route", async () => {
      const md = "[Beginner Examples](./beginner.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain(
        'href="/en/learn/fundamentally-strong/software-engineer/just-enough-nvim/learning/beginner"',
      );
      expect(html).not.toContain(".md");
    });

    it("resolves a relative link to a section's _index.md to the section's own route", async () => {
      const md = "[Section](../_index.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/just-enough-nvim"');
    });

    it("leaves already-absolute /en/ links untouched", async () => {
      const md = "[Home](/en/learn/fundamentally-strong)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain('href="/en/learn/fundamentally-strong"');
    });

    it("leaves external, mailto, and in-page anchor links untouched", async () => {
      const md = "[External](https://example.com/x.md) [Mail](mailto:a@example.com) [Anchor](#section)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain('href="https://example.com/x.md"');
      expect(html).toContain('href="mailto:a@example.com"');
      expect(html).toContain('href="#section"');
    });

    it("passes relative links through unresolved when no slug context is provided", async () => {
      const md = "[Beginner Examples](./beginner.md)";
      const { html } = await parseMarkdown(md);

      expect(html).toContain('href="./beginner.md"');
    });

    it("leaves a relative link to a non-.md asset untouched instead of routing it as content", async () => {
      const md = "[Slides](./slides.pdf) [Diagram](../assets/diagram.svg)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: currentSlug });

      expect(html).toContain('href="./slides.pdf"');
      expect(html).toContain('href="../assets/diagram.svg"');
      expect(html).not.toContain('href="/en/');
    });
  });

  describe("in-body relative content links authored from a section index page", () => {
    // isSection: true means this slug's file is `.../just-enough-nvim/_index.md`, so the
    // section's own containing directory is the slug itself, not dirname(slug).
    const sectionSlug = "learn/fundamentally-strong/software-engineer/just-enough-nvim";

    it("resolves a same-directory sibling link relative to the section's own directory, not its parent", async () => {
      const md = "[Sibling Topic](./sibling.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: sectionSlug, isSection: true });

      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/just-enough-nvim/sibling"');
      expect(html).not.toContain(".md");
    });

    it("resolves a directory-climbing link relative to the section's own directory, not one level above it", async () => {
      const md = "[Parent Topic](../overview.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: sectionSlug, isSection: true });

      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/overview"');
      expect(html).not.toContain(".md");
    });

    it("resolves the identical sibling link differently when the same slug is a leaf page instead of a section index", async () => {
      const md = "[Sibling Topic](./sibling.md)";
      const { html } = await parseMarkdown(md, { locale: "en", slug: sectionSlug, isSection: false });

      expect(html).toContain('href="/en/learn/fundamentally-strong/software-engineer/sibling"');
    });
  });

  describe("lesson heading outline over the real corpus (EWT-002/EWT-003)", () => {
    // Corpus sweep body lives in ./corpus-outline-sweep (sharded across
    // corpus-outline-sweep-0..3.test.ts for CI parallelism); raw <h1-6> outside
    // fences is absent corpus-wide, transformShortcodes emits no headings, and
    // math/GFM/slug/autolink never change heading levels — so the mdast depths
    // the helper collects are exactly the pre-normalization levels the
    // production pipeline sees, checked through the REAL normalizeHeadingLevels.
    it("demotes raw HTML headings through the full pipeline (hast-level raw handling)", async () => {
      const md = "<h1>Raw title</h1>\n\n## Markdown section";
      const { html } = await parseMarkdown(md);

      expect(html).not.toContain("<h1");
      expect(html).toContain("<h2");
      expect(html).toContain("<h3");
    });
  });
});
