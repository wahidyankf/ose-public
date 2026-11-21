import "./helpers/test-setup";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature"),
);

const luaFigureHtml = `<figure data-rehype-pretty-code-figure><pre data-language="lua"><code><span>print("hi")</span></code></pre></figure>`;
const mermaidFigureHtml = `<figure data-rehype-pretty-code-figure><pre data-language="mermaid"><code>graph TD; A-->B;</code></pre></figure>`;

// The content-rendering contract is verified at the renderer boundary: the about page's code sample
// and mermaid diagram reach the reader through the same MarkdownRenderer that this unit renders.
describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Code blocks in site content show a copy button
  Scenario("Code blocks in site content show a copy button", ({ Given, Then }) => {
    Given("a reader opens the about page with a code sample", () => {
      expect(luaFigureHtml).toContain('data-language="lua"');
      expect(luaFigureHtml).not.toContain('data-language="mermaid"');
      cleanup();
      render(<MarkdownRenderer html={luaFigureHtml} />);
    });

    Then("the code sample shows a copy button", () => {
      expect(document.querySelector('[data-slot="code-block"]')).toBeTruthy();
      expect(document.querySelector('[data-slot="code-block-copy"]')).toBeTruthy();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Mermaid diagrams show no copy button
  Scenario("Mermaid diagrams show no copy button", ({ Given, Then }) => {
    Given("a reader opens the about page with a mermaid diagram", () => {
      expect(mermaidFigureHtml).toContain('data-language="mermaid"');
      cleanup();
      render(<MarkdownRenderer html={mermaidFigureHtml} />);
    });

    Then("the mermaid diagram shows no copy button", () => {
      // Real SVG rendering needs browser APIs jsdom lacks (see mermaid.tsx); before the async
      // `mermaid.render()` resolves, MermaidDiagram renders its <pre><code> fallback. Asserting that
      // plus the absence of the copy button is the exclusion regression guard.
      expect(document.querySelector("pre")).toBeTruthy();
      expect(document.querySelector('[data-slot="code-block-copy"]')).toBeNull();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Clicking the copy button copies the code to the clipboard and confirms it
  Scenario(
    "Clicking the copy button copies the code to the clipboard and confirms it",
    ({ Given, When, Then, And }) => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      Given("a reader opens the about page with a code sample", () => {
        Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
        cleanup();
        render(<MarkdownRenderer html={luaFigureHtml} />);
      });

      When("the reader clicks the copy button of the code sample", () => {
        fireEvent.click(document.querySelector('[data-slot="code-block-copy"]') as HTMLElement);
      });

      Then("the code sample is copied to the clipboard", async () => {
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('print("hi")'));
      });

      And("the copy button confirms the copy", async () => {
        await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
      });
    },
  );
});
