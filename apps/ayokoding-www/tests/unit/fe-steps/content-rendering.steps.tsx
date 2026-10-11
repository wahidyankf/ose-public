import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";
import { MARKDOWN_PROSE_CLASS, MarkdownRenderer } from "@/features/content/shell/markdown-renderer";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/content/content-rendering.feature"),
);

const sampleHtml = `<h2 id="intro">Introduction</h2><p>Body text paragraph.</p><h3 id="sub">Subsection</h3><p>More text.</p>`;
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (_id: string, chart: string) => ({
      svg: `<svg role="img" aria-label="${chart}"><text>diagram</text></svg>`,
    })),
  },
}));

const codeHtml = `<figure data-rehype-pretty-code-figure><pre data-language="go"><code><span style="color:#fff">package main</span></code></pre></figure>`;
const calloutHtml = `<div data-callout="warning"><p>Watch out!</p></div>`;
const tabsHtml = `<div data-tabs="Tab1,Tab2"><div data-tab><p>Panel 1</p></div><div data-tab><p>Panel 2</p></div></div>`;
const youtubeHtml = `<div data-youtube="dQw4w9WgXcQ"></div>`;
const stepsHtml = `<div data-steps><ol><li>Step one</li><li>Step two</li></ol></div>`;
const sectionHeadingHtml = `<h2 id="x"><a href="#x">X</a></h2>`;
const inlineCodeHtml = `<p>Run <code>nvim --version</code></p>`;

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(MarkdownRenderer).toBeTypeOf("function");
    });
  });

  Scenario("Markdown prose renders with proper formatting classes", ({ When, Then, And }) => {
    When("a visitor opens a content page with prose body text", () => {
      render(<MarkdownRenderer html={sampleHtml} locale="en" />);
    });

    Then("the body text should have prose typography classes applied", () => {
      const container = document.querySelector(".prose");
      expect(container?.className).toBe(MARKDOWN_PROSE_CLASS);
      expect(container).toHaveClass("prose", "prose-neutral", "dark:prose-invert", "prose-p:leading-7");
    });

    And("headings should be visually distinct from body text", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass("prose-headings:font-semibold", "prose-headings:text-foreground");
      expect(screen.getByRole("heading", { level: 2, name: "Introduction" }).nextElementSibling).toBe(
        screen.getByText("Body text paragraph."),
      );
    });

    And("paragraph spacing should be consistent", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass("prose-p:my-4");
      expect([...document.querySelectorAll(".prose > p")].map((paragraph) => paragraph.textContent)).toEqual([
        "Body text paragraph.",
        "More text.",
      ]);
    });
  });

  Scenario("Code blocks render with syntax highlighting via Shiki", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a fenced code block", () => {
      render(<MarkdownRenderer html={codeHtml} locale="en" />);
    });

    Then("the code block should display with syntax-highlighted tokens", () => {
      expect(document.querySelector('code span[style*="color"]')?.textContent).toBe("package main");
    });

    And("the language label should be shown above the code block", () => {
      expect(screen.getByText("go").getAttribute("data-code-language-label")).not.toBeNull();
    });

    And("the block should use a monospace font", () => {
      expect(document.querySelector("pre")?.closest("[data-slot='code-block']")).toBeTruthy();
    });
  });

  Scenario("Callout shortcode renders as an Alert admonition", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a callout shortcode", () => {
      render(<MarkdownRenderer html={calloutHtml} locale="en" />);
    });

    Then("the callout should render as an admonition block", () => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    And("the admonition should display the appropriate icon and label for its type", () => {
      const alert = screen.getByRole("alert");
      expect(alert.getAttribute("data-variant")).toBe("warning");
      expect(alert.querySelector("svg")).toBeTruthy();
    });

    And("the callout body text should be visible inside the admonition", () => {
      expect(screen.getByText("Watch out!")).toBeTruthy();
    });
  });

  Scenario("Tabs shortcode renders as tabbed panels", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a tabs shortcode", () => {
      render(<MarkdownRenderer html={tabsHtml} locale="en" />);
    });

    Then("the tabs should render as a tab bar with clickable tab labels", () => {
      expect(screen.getByText("Tab1")).toBeTruthy();
    });

    And("the visitor clicks a tab label", () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Tab2" }), { button: 0, ctrlKey: false });
      fireEvent.click(screen.getByRole("tab", { name: "Tab2" }));
    });

    And("the corresponding panel content should become visible", () => {
      expect(screen.getByRole("tabpanel").textContent).toContain("Panel 2");
    });

    And("the other panels should be hidden", () => {
      expect(screen.queryByText("Panel 1")).toBeNull();
    });
  });

  Scenario("YouTube shortcode renders as a responsive iframe embed", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a YouTube shortcode", () => {
      render(<MarkdownRenderer html={youtubeHtml} locale="en" />);
    });

    Then("a responsive iframe embed should be visible", () => {
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeTruthy();
    });

    And("the iframe src should point to the YouTube embed URL", () => {
      const iframe = document.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toContain("youtube.com/embed/dQw4w9WgXcQ");
    });

    And("the embed should maintain a 16:9 aspect ratio", () => {
      expect(document.querySelector("iframe")?.parentElement?.className).toMatch(/aspect-video/);
    });
  });

  Scenario("Steps shortcode renders as a numbered step list", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a steps shortcode", () => {
      render(<MarkdownRenderer html={stepsHtml} locale="en" />);
    });

    Then("the steps should render as an ordered list of numbered items", () => {
      const ol = document.querySelector("ol");
      expect(ol).toBeTruthy();
    });

    And("each step should display its number prominently", () => {
      const items = document.querySelectorAll("li");
      expect(items.length).toBe(2);
      expect(document.querySelector("ol")?.parentElement?.className).toMatch(/counter-reset:step/);
    });

    And("the step content should be indented beneath its number", () => {
      expect(screen.getByText("Step one")).toBeTruthy();
    });
  });

  Scenario("Inline math expression renders via KaTeX", ({ When, Then, And }) => {
    When("a visitor opens a content page containing an inline math expression delimited by $...$", () => {
      render(
        <MarkdownRenderer
          html="<p>The formula <span class='katex' aria-label='E equals m c squared'><span class='katex-html'>E=mc²</span></span> is famous.</p>"
          locale="en"
        />,
      );
    });

    Then("the expression should render as formatted math notation inline with surrounding text", () => {
      expect(document.querySelector(".katex")?.getAttribute("aria-label")).toBe("E equals m c squared");
    });

    And("the rendered math should not display raw LaTeX source", () => {
      expect(document.body.textContent).not.toContain("$E=mc^2$");
    });
  });

  Scenario("Block math expression renders via KaTeX", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a block math expression delimited by $$...$$", () => {
      render(
        <MarkdownRenderer
          html="<div class='katex-display'><span class='katex' aria-label='sum from i equals one to n'>∑ᵢ₌₁ⁿ</span></div>"
          locale="en"
        />,
      );
    });

    Then("the expression should render as a centered display math block", () => {
      const math = document.querySelector(".katex-display");
      expect(math).toBeTruthy();
    });

    And("the rendered math should not display raw LaTeX source", () => {
      expect(document.body.textContent).not.toContain("$$\\sum_{i=1}^n$$");
    });
  });

  Scenario("Mermaid diagram renders as an SVG", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a Mermaid code block", () => {
      render(
        <MarkdownRenderer
          html='<figure data-rehype-pretty-code-figure><pre data-language="mermaid"><code>graph TD; A--&gt;B;</code></pre></figure>'
          locale="en"
        />,
      );
    });

    Then("the diagram should render as an inline SVG element", async () => {
      await waitFor(() => expect(document.querySelector("svg[role='img']")).toBeTruthy());
    });

    And("the raw Mermaid source should not be visible to the visitor", async () => {
      await waitFor(() => expect(document.querySelector("pre code")).toBeNull());
    });
  });

  Scenario("Raw HTML details disclosure renders correctly", ({ When, Then, And }) => {
    When("a visitor opens a content page containing a raw HTML details disclosure", () => {
      render(
        <MarkdownRenderer html="<details><summary>Answer</summary><p>Authored answer</p></details>" locale="en" />,
      );
    });

    Then("the HTML elements should render in the browser as expected", () => {
      expect(screen.getByText("Answer").closest("details")).toBeTruthy();
    });

    And("the disclosure should reveal its authored answer when opened", () => {
      const details = screen.getByText("Answer").closest("details")!;
      fireEvent.click(screen.getByText("Answer"));
      expect(details.open).toBe(true);
      expect(screen.getByText("Authored answer")).toBeTruthy();
    });
  });

  Scenario("Section headings render as headings, not as links", ({ When, Then, And }) => {
    When("a visitor opens a content page with section headings", () => {
      render(<MarkdownRenderer html={sectionHeadingHtml} locale="en" />);
    });

    Then("each section heading is shown in the heading text colour without an underline", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass(
        "prose-headings:[&>a]:no-underline",
        "prose-headings:[&>a]:text-inherit",
        "prose-headings:[&>a]:[font-weight:inherit]",
      );
    });

    And("the heading still links to its own anchor", () => {
      const heading = screen.getByRole("heading", { level: 2, name: "X" });
      const anchor = heading.querySelector("a");
      expect(anchor).toBeTruthy();
      expect(anchor?.getAttribute("href")).toBe("#x");
      expect(anchor?.getAttribute("href")).toBe(`#${heading.getAttribute("id")}`);
    });
  });

  Scenario("Inline code renders without literal backticks", ({ When, Then, And }) => {
    When("a visitor opens a content page containing inline code", () => {
      render(<MarkdownRenderer html={inlineCodeHtml} locale="en" />);
    });

    Then("the inline code shows no backtick characters before or after it", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass("prose-code:before:content-none", "prose-code:after:content-none");
      const inlineCode = screen.getByText("nvim --version");
      expect(inlineCode.tagName).toBe("CODE");
      expect(container?.textContent).not.toContain("`");
    });

    And("the inline code uses the surrounding text's font weight", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass("[&_:not(pre)>code]:[font-weight:inherit]");
      const inlineCode = screen.getByText("nvim --version");
      const paragraph = inlineCode.closest("p");
      expect(paragraph).toBeTruthy();
      expect(getComputedStyle(inlineCode).fontWeight).toBe(getComputedStyle(paragraph!).fontWeight);
    });
  });
});
