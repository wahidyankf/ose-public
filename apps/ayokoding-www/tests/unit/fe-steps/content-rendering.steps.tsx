import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import "./helpers/test-setup";
import { MARKDOWN_PROSE_CLASS, MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
import { MermaidDiagram } from "@/features/content/shell/mermaid";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/content/content-rendering.feature"),
);

const sampleHtml = `<h2 id="intro">Introduction</h2><p>Body text paragraph.</p><h3 id="sub">Subsection</h3><p>More text.</p>`;
const { renderDiagram } = vi.hoisted(() => ({
  renderDiagram: vi.fn(async (_id: string, chart: string) => ({
    svg: `<svg role="img" aria-label="${chart}"><text>diagram</text></svg>`,
  })),
}));
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: renderDiagram,
  },
}));

const codeHtml = `<figure data-rehype-pretty-code-figure><pre data-language="go"><code><span style="color:#fff">package main</span></code></pre></figure>`;
const calloutHtml = `<div data-callout="warning"><p>Watch out!</p></div>`;
const tabsHtml = `<div data-tabs="Tab1,Tab2"><div data-tab><p>Panel 1</p></div><div data-tab><p>Panel 2</p></div></div>`;
const youtubeHtml = `<div data-youtube="dQw4w9WgXcQ"></div>`;
const stepsHtml = `<div data-steps><ol><li>Step one</li><li>Step two</li></ol></div>`;
const sectionHeadingHtml = `<h2 id="x"><a href="#x">X</a></h2>`;
const inlineCodeHtml = `<p>Run <code>nvim --version</code></p>`;

// Mermaid keyboard-access fixtures. The scenarios hold the renderer pending or fail it through the
// hoisted mock, mirroring the controlled-render approach of mermaid.test.tsx.
const diagramSource = "flowchart LR\n  A[Read the source] --> B[Follow the diagram]";
const flowSvg = '<svg role="img" aria-label="Source flow"><text>Rendered diagram</text></svg>';

function controlMermaidRendering() {
  const started = Promise.withResolvers<void>();
  const result = Promise.withResolvers<{ svg: string }>();
  renderDiagram.mockImplementationOnce(() => {
    started.resolve();
    return result.promise;
  });
  return { started: started.promise, result };
}

function renderMermaidBetweenControls() {
  render(
    <>
      <button type="button">Before diagram</button>
      <MermaidDiagram chart={diagramSource} />
      <button type="button">After diagram</button>
    </>,
  );
  const fallback = screen.getByText(diagramSource, { selector: "code", normalizer: (text) => text }).parentElement;
  if (!(fallback instanceof HTMLPreElement)) {
    throw new Error("The diagram source must remain in its preformatted fallback");
  }
  return fallback;
}

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
      // The source block is the diagram's own reserved size (S8: the lesson's progress controls
      // below it must not move when the diagram appears), so it stays in the document and is taken
      // out of the visitor's view with `visibility: hidden` — `invisible` is that token. The browser
      // tier proves the computed visibility over a real page; here the reserved block must be
      // present, still carry the source, and be hidden.
      await waitFor(() => expect(document.querySelector("pre")).toHaveClass("invisible"));
      expect(document.querySelector("pre")?.textContent).toContain("graph TD");
      expect(document.querySelector("svg[role='img']")).toBeTruthy();
    });
  });

  Scenario("Mermaid source stays keyboard reachable while its diagram is pending", ({ Given, And, When, Then }) => {
    let rendering: ReturnType<typeof controlMermaidRendering>;
    let user: ReturnType<typeof userEvent.setup>;
    let fallback: HTMLPreElement;

    Given("a visitor opens a content page with a Mermaid code block between two controls", async () => {
      rendering = controlMermaidRendering();
      user = userEvent.setup();
      fallback = renderMermaidBetweenControls();
      await rendering.started;
    });
    And("the diagram is still rendering", () => {
      expect(screen.queryByRole("img", { name: "Source flow" })).not.toBeInTheDocument();
    });
    When("the visitor presses Tab to reach the control before the code block", async () => {
      await user.tab();
      expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
    });
    And("the visitor presses Tab again", async () => {
      await user.tab();
    });
    Then("the Mermaid source should have keyboard focus", () => {
      expect(fallback).toHaveFocus();
      expect(fallback).toHaveTextContent("Read the source");
    });
    When("the visitor presses Tab once more", async () => {
      await user.tab();
    });
    Then("focus should move to the control after the code block", () => {
      expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
    });
  });

  Scenario("Mermaid source stays keyboard reachable when its diagram fails to render", ({ Given, When, And, Then }) => {
    let rendering: ReturnType<typeof controlMermaidRendering>;
    let user: ReturnType<typeof userEvent.setup>;
    let fallback: HTMLPreElement;

    Given("a visitor opens a content page with a Mermaid code block between two controls", async () => {
      rendering = controlMermaidRendering();
      user = userEvent.setup();
      fallback = renderMermaidBetweenControls();
      await rendering.started;
    });
    When("the diagram rendering fails", async () => {
      const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const failure = new Error("Synthetic Mermaid render failure");

      await act(async () => {
        rendering.result.reject(failure);
        await rendering.result.promise.catch(() => undefined);
      });

      expect(warning).toHaveBeenCalledExactlyOnceWith("[mermaid] Failed to render diagram:", failure);
      warning.mockRestore();
    });
    And("the visitor presses Tab to reach the control before the code block", async () => {
      await user.tab();
      expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
    });
    And("the visitor presses Tab again", async () => {
      await user.tab();
    });
    Then("the Mermaid source should have keyboard focus", () => {
      expect(fallback).toHaveFocus();
      expect(fallback).toHaveTextContent("Read the source");
    });
    When("the visitor presses Tab once more", async () => {
      await user.tab();
    });
    Then("focus should move to the control after the code block", () => {
      expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
    });
  });

  Scenario("The Mermaid source leaves keyboard focus order once the diagram renders", ({ When, And, Then }) => {
    let rendering: ReturnType<typeof controlMermaidRendering>;
    let user: ReturnType<typeof userEvent.setup>;
    let fallback: HTMLPreElement;

    When("a visitor opens a content page containing a Mermaid code block", async () => {
      rendering = controlMermaidRendering();
      user = userEvent.setup();
      fallback = renderMermaidBetweenControls();
      await rendering.started;
    });
    And("the diagram should render as an inline SVG element", async () => {
      await act(async () => {
        rendering.result.resolve({ svg: flowSvg });
        await rendering.result.promise;
      });

      expect(screen.getByRole("img", { name: "Source flow" })).toHaveTextContent("Rendered diagram");
      expect(screen.getByText(diagramSource, { selector: "code", normalizer: (text) => text }).parentElement).toBe(
        fallback,
      );
      expect(fallback).toHaveTextContent("Read the source");
    });
    Then("the Mermaid source should be removed from keyboard focus order", async () => {
      await user.tab();
      expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
    });
  });

  Scenario(
    "The focused Mermaid source has a visible indicator in light and dark themes",
    ({ Given, And, When, Then }) => {
      let rendering: ReturnType<typeof controlMermaidRendering>;
      let fallback: HTMLPreElement;

      Given("a visitor opens a content page with a Mermaid code block", () => {
        rendering = controlMermaidRendering();
        fallback = renderMermaidBetweenControls();
      });
      And("the diagram is still rendering", async () => {
        await rendering.started;
        expect(screen.queryByRole("img", { name: "Source flow" })).not.toBeInTheDocument();
      });
      When("the visitor moves keyboard focus to the Mermaid source", () => {
        act(() => {
          fallback.focus();
        });
        expect(fallback).toHaveFocus();
      });
      Then("the Mermaid source should show an outline drawn in the foreground colour", () => {
        // jsdom does not resolve the Tailwind cascade, so the binding pins the utility contract. Recorded
        // ratios from the foreground token (warm-900 / hsl(210 40% 98%)): light 19.55:1 against the code
        // surface, dark 14.01:1. The browser-measured ratio is the owner's live check after a rebuild.
        expect(fallback.tabIndex).toBe(0);
        expect(fallback.classList.contains("focus-visible:outline-2")).toBe(true);
        expect(fallback.classList.contains("focus-visible:outline-offset-2")).toBe(true);
        expect(fallback.classList.contains("focus-visible:outline-foreground")).toBe(true);
      });
      And("that outline should contrast with the code surface by at least 3 to 1 in both themes", () => {
        // The design-system ring token is below 3:1 in dark (DWT-002), so the outline must not use it.
        expect([...fallback.classList].some((className) => className.includes("ring"))).toBe(false);
      });
    },
  );

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

  // UWT-005 fix (phase-8 rule-15 retest) — the structural contract for the horizontal-overflow
  // guard. The real scrollWidth is a layout measurement verified at e2e level (scrollWidth <= 375
  // on the long-token page); the unit tier asserts the renderer ships the overflow-containment
  // tokens: inline chips may break anywhere inside themselves and fenced blocks scroll internally
  // instead of widening the article.
  let longTokenHtml = "";
  Scenario("Course content never scrolls the document horizontally at 375", ({ Given, When, Then, And }) => {
    Given("a content page containing a long inline code token on a phone-wide article", () => {
      longTokenHtml =
        "<p>Use <code>packages/some-extremely-long-package-name/typescript-configuration-invariant</code> today.</p>" +
        '<figure data-rehype-pretty-code-figure><pre data-language="bash"><code>npm install packages/some-extremely-long-package-name/typescript-configuration-invariant</code></pre></figure>';
    });

    When("its prose renders at a 375px viewport", () => {
      render(<MarkdownRenderer html={longTokenHtml} locale="en" />);
    });

    Then("the inline code chips break within themselves instead of widening the page", () => {
      const container = document.querySelector(".prose");
      expect(container).toHaveClass("[&_:not(pre)>code]:[overflow-wrap:anywhere]");
    });

    And("the fenced code blocks stay confined to the article with an internal horizontal scroll", () => {
      // The fenced-block containment rule lives in the app's global stylesheet (no class token on
      // the element), and jsdom has no layout, so the real "scrollWidth stays inside the article"
      // measurement is the e2e tier's job (over the statistics-for-evaluation long-token page).
      // The unit tier asserts the DOM shape that keeps fences inside the article: the pre is a
      // child of the bounded prose container, never a free-floating sibling.
      const container = document.querySelector(".prose");
      const pre = document.querySelector("pre");
      expect(pre).toBeTruthy();
      expect(container?.contains(pre!)).toBe(true);
    });
  });
});
