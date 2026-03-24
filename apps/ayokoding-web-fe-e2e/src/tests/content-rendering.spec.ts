import { test, expect } from "@playwright/test";

test.describe("Content Rendering", () => {
  test("renders prose content on a content page", async ({ page }) => {
    await page.goto("/en/learn/overview");

    const article = page.getByRole("article");
    await expect(article).toBeVisible();
    await expect(article).not.toBeEmpty();
  });

  test("displays page heading", async ({ page }) => {
    await page.goto("/en/learn/overview");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("renders code blocks with syntax highlighting", async ({ page }) => {
    await page.goto("/en/learn/software-engineering/programming-languages/golang/by-example/beginner");

    // Code block container (rehype-pretty-code wraps in figure)
    const codeFigure = page.locator("figure[data-rehype-pretty-code-figure]").first();
    await expect(codeFigure).toBeVisible({ timeout: 10000 });

    // Code spans should have shiki color CSS variables (syntax highlighting)
    const coloredSpan = codeFigure.locator("span[style*='--shiki-light']").first();
    await expect(coloredSpan).toBeAttached();
  });

  test("code blocks are left-aligned, not centered", async ({ page }) => {
    await page.goto("/en/learn/software-engineering/platform-web/tools/clojure-pedestal/by-example/advanced");

    const codeFigure = page.locator("figure[data-rehype-pretty-code-figure]").first();
    await expect(codeFigure).toBeVisible({ timeout: 10000 });

    // Code block should NOT have centered text
    const textAlign = await codeFigure.evaluate((el) => window.getComputedStyle(el).textAlign);
    expect(textAlign).not.toBe("center");
  });

  test("mermaid diagram renders as SVG, not raw text", async ({ page }) => {
    // Use a lightweight page with mermaid diagrams (faster load in Docker CI)
    test.setTimeout(60000);
    await page.goto("/en/learn/artificial-intelligence/chat-with-pdf");
    await page.waitForLoadState("networkidle");

    // Mermaid renders client-side — the component replaces <pre> with <svg>
    const mermaidSvg = page.locator("[id*='mermaid'], svg.mermaid");
    await expect(mermaidSvg.first()).toBeAttached({ timeout: 45000 });
  });
});
