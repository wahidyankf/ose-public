import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

When("a visitor opens a content page with prose body text", async ({ page }) => {
  await page.goto("/en/learn/overview");
});

Then("the body text should have prose typography classes applied", async ({ page }) => {
  const prose = page.locator(".prose, [class*='prose']").first();
  await expect(prose).toBeVisible();
  const paragraph = prose.locator("p").first();
  const typography = await paragraph.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  expect(typography.fontFamily).not.toBe("");
  expect(typography.fontSize).toBeGreaterThanOrEqual(16);
  expect(typography.lineHeight).toBeGreaterThan(typography.fontSize);
});

Then("headings should be visually distinct from body text", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 2 }).first();
  await expect(heading).toBeVisible();
  const paragraph = page.locator("article .prose p").first();
  const [headingStyle, paragraphStyle] = await Promise.all([
    heading.evaluate((element) => ({
      size: Number.parseFloat(getComputedStyle(element).fontSize),
      weight: Number.parseInt(getComputedStyle(element).fontWeight, 10),
    })),
    paragraph.evaluate((element) => ({
      size: Number.parseFloat(getComputedStyle(element).fontSize),
      weight: Number.parseInt(getComputedStyle(element).fontWeight, 10),
    })),
  ]);
  expect(headingStyle.size).toBeGreaterThan(paragraphStyle.size);
  expect(headingStyle.weight).toBeGreaterThan(paragraphStyle.weight);
});

Then("paragraph spacing should be consistent", async ({ page }) => {
  const paragraphs = page.locator("article .prose p");
  expect(await paragraphs.count()).toBeGreaterThan(1);
  const spacings = await paragraphs.evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => {
      const style = getComputedStyle(element);
      return { marginTop: style.marginTop, marginBottom: style.marginBottom, lineHeight: style.lineHeight };
    }),
  );
  expect(
    new Set(spacings.map(({ marginTop, marginBottom, lineHeight }) => `${marginTop}|${marginBottom}|${lineHeight}`))
      .size,
  ).toBe(1);
  expect(Number.parseFloat(spacings[0]!.marginBottom)).toBeGreaterThan(0);
});

When("a visitor opens a content page containing a fenced code block", async ({ page }) => {
  await page.goto("/en/learn/legacy/software-engineering/programming-languages/golang/by-example/beginner");
});

Then("the code block should display with syntax-highlighted tokens", async ({ page }) => {
  const codeFigure = page.locator("figure[data-rehype-pretty-code-figure]").first();
  await expect(codeFigure).toBeVisible({ timeout: 10000 });

  const coloredSpan = codeFigure.locator("span[style*='--shiki-light']").first();
  await expect(coloredSpan).toBeAttached();
});

Then("the language label should be shown above the code block", async ({ page }) => {
  const figure = page
    .locator("figure[data-rehype-pretty-code-figure]")
    .filter({ has: page.locator('pre[data-language="go"]') })
    .first();
  const langLabel = figure.locator("xpath=preceding-sibling::*[@data-code-language-label][1]");
  await expect(langLabel).toBeVisible();
  await expect(langLabel).toHaveText("go");
  const [labelBox, figureBox] = await Promise.all([langLabel.boundingBox(), figure.boundingBox()]);
  expect(labelBox).not.toBeNull();
  expect(figureBox).not.toBeNull();
  expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(figureBox!.y);
});

Then("the block should use a monospace font", async ({ page }) => {
  const codeEl = page.locator("figure[data-rehype-pretty-code-figure] code").first();
  await expect(codeEl).toBeVisible();
  const fontFamily = await codeEl.evaluate((el) => window.getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toMatch(/mono|courier|consolas|menlo|inconsolata|fira/i);
});

When("a visitor opens a content page containing a callout shortcode", async ({ page }) => {
  await page.goto("/en/learn/legacy/information-security/tools/gobuster/beginner");
});

Then("the callout should render as an admonition block", async ({ page }) => {
  await expect(page.locator('[data-slot="alert"][data-variant="warning"]').first()).toBeVisible();
});

Then("the admonition should display the appropriate icon and label for its type", async ({ page }) => {
  const warning = page.locator('[data-slot="alert"][data-variant="warning"]').first();
  await expect(warning.locator("svg")).toBeVisible();
  await expect(warning).toContainText("Legal and Ethical Notice");
});

Then("the callout body text should be visible inside the admonition", async ({ page }) => {
  await expect(page.locator('[data-slot="alert-description"]').first()).toContainText(
    "Only use Gobuster on systems you own or have explicit written permission",
  );
});

When("a visitor opens a content page containing a tabs shortcode", async ({ page }) => {
  await page.goto("/en/learn/legacy/software-engineering/system-design/by-example/beginner");
});

Then("the tabs should render as a tab bar with clickable tab labels", async ({ page }) => {
  await expect(page.getByRole("tablist").first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "Go", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "Python", exact: true }).first()).toBeVisible();
});

When("the visitor clicks a tab label", async ({ page }) => {
  await page.getByRole("tab", { name: "Python", exact: true }).first().click();
});

Then("the corresponding panel content should become visible", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Python", exact: true }).first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").filter({ visible: true }).first()).toBeVisible();
});

Then("the other panels should be hidden", async ({ page }) => {
  const goTab = page.getByRole("tab", { name: "Go", exact: true }).first();
  await expect(goTab).toHaveAttribute("aria-selected", "false");
  const goPanelId = await goTab.getAttribute("aria-controls");
  expect(goPanelId).not.toBeNull();
  await expect(page.locator(`#${goPanelId}`)).toBeHidden();
});

When("a visitor opens a content page containing a steps shortcode", async ({ page }) => {
  await page.goto("/en/learn/legacy/information-security/tools/gobuster/quick-start");
});

Then("the steps should render as an ordered list of numbered items", async ({ page }) => {
  const steps = page.locator(".\\[counter-reset\\:step\\]").first();
  await expect(steps).toBeVisible();
  await expect(steps.getByRole("heading", { name: /^Step 1:/ })).toBeVisible();
  await expect(steps.getByRole("heading", { name: /^Step 2:/ })).toBeVisible();
});

Then("each step should display its number prominently", async ({ page }) => {
  const firstStep = page.getByRole("heading", { name: /^Step 1:/ });
  await expect(firstStep).toBeVisible();
  expect(
    Number.parseInt(await firstStep.evaluate((element) => getComputedStyle(element).fontWeight), 10),
  ).toBeGreaterThanOrEqual(600);
});

Then("the step content should be indented beneath its number", async ({ page }) => {
  const steps = page.locator(".\\[counter-reset\\:step\\]").first();
  const paddingLeft = await steps.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingLeft));
  expect(paddingLeft).toBeGreaterThan(0);
});

When("a visitor opens a content page containing an inline math expression delimited by $...$", async ({ page }) => {
  await page.goto("/en/learn/legacy/business/corporate-finance");
});

Then("the expression should render as formatted math notation inline with surrounding text", async ({ page }) => {
  await expect
    .poll(() =>
      page.locator(".katex").evaluateAll((elements) => elements.some((element) => !element.closest(".katex-display"))),
    )
    .toBe(true);
});

Then("the rendered math should not display raw LaTeX source", async ({ page }) => {
  await expect(page.getByRole("article")).not.toContainText("$\\beta$");
});

When("a visitor opens a content page containing a block math expression delimited by $$...$$", async ({ page }) => {
  await page.goto("/en/learn/legacy/business/accounting");
});

Then("the expression should render as a centered display math block", async ({ page }) => {
  const displayMath = page.locator(".katex-display").first();
  await expect(displayMath).toBeVisible();
  expect(await displayMath.evaluate((element) => getComputedStyle(element).textAlign)).toBe("center");
});

When("a visitor opens a content page containing a Mermaid code block", async ({ page }) => {
  await page.goto("/en/learn/courses/project-management/learning/beginner");
});

Then("the diagram should render as an inline SVG element", async ({ page }) => {
  await expect(page.getByRole("article").locator('svg[id^="mermaid-"]').first()).toBeVisible({ timeout: 15_000 });
});

Then("the raw Mermaid source should not be visible to the visitor", async ({ page }) => {
  await expect(page.locator('pre code[data-language="mermaid"]')).toHaveCount(0);
});

When("a visitor opens a content page containing a raw HTML details disclosure", async ({ page }) => {
  await page.goto("/en/learn/courses/graph-databases/drilling/overview");
});

Then("the HTML elements should render in the browser as expected", async ({ page }) => {
  const details = page.getByRole("article").locator("details").first();
  await expect(details).toBeVisible();
  await expect(details.locator("summary")).toHaveText("Answer");
});

Then("the disclosure should reveal its authored answer when opened", async ({ page }) => {
  const details = page.getByRole("article").locator("details").first();
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details).toContainText("A property graph is built from nodes");
});

When("a visitor opens a content page with section headings", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-nvim/learning/overview");
});

Then("each section heading is shown in the heading text colour without an underline", async ({ page }) => {
  const headingLink = page.locator("article h2 > a").first();
  await expect(headingLink).toBeVisible();
  const styles = await headingLink.evaluate((element) => ({
    textDecorationLine: getComputedStyle(element).textDecorationLine,
    anchorColor: getComputedStyle(element).color,
    headingColor: getComputedStyle(element.parentElement as Element).color,
  }));
  expect(styles.textDecorationLine).toBe("none");
  expect(styles.anchorColor).toBe(styles.headingColor);
});

Then("the heading still links to its own anchor", async ({ page }) => {
  const headingLink = page.locator("article h2 > a").first();
  await expect(headingLink).toBeVisible();
  const href = await headingLink.getAttribute("href");
  expect(href).not.toBeNull();
  expect(href!.startsWith("#")).toBe(true);
});

When("a visitor opens a content page containing inline code", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-nvim/learning/overview");
});

Then("the inline code shows no backtick characters before or after it", async ({ page }) => {
  // Inline code only: HTML forbids a `pre` inside a `p`, so `article p code` never matches
  // the fenced-block `pre > code` pairs.
  const inlineCode = page.locator("article p code").first();
  await expect(inlineCode).toBeVisible();
  const pseudoContent = await inlineCode.evaluate((element) => ({
    before: getComputedStyle(element, "::before").content,
    after: getComputedStyle(element, "::after").content,
  }));
  // A pseudo-element without generated content reports "none" (Firefox) or "normal"
  // (Chromium/WebKit); either means no literal backticks are generated around the code.
  expect(["none", "normal"]).toContain(pseudoContent.before);
  expect(["none", "normal"]).toContain(pseudoContent.after);
});

Then("the inline code uses the surrounding text's font weight", async ({ page }) => {
  const inlineCode = page.locator("article p code").first();
  await expect(inlineCode).toBeVisible();
  const weights = await inlineCode.evaluate((element) => ({
    code: getComputedStyle(element).fontWeight,
    paragraph: getComputedStyle(element.parentElement as Element).fontWeight,
  }));
  expect(weights.code).toBe(weights.paragraph);
});

// course-content-hygiene.feature, scenario 1 — no catalogue number in course titles.
Given("the published English course library", async () => {
  // The course library is the static content tree served by the running app; no setup needed.
});

When("its course titles are read", async ({ page }) => {
  await page.goto("/en/learn/courses");
  await page.waitForLoadState("networkidle");
});

Then("no course title starts with a catalogue number or a pass number", async ({ page }) => {
  const numbered = /^\d+\s*·\s|^Pass \d+ /;
  const links = page.getByRole("main").getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const text = (await links.nth(i).innerText()).trim();
    expect(text).not.toMatch(numbered);
  }
});

Then("the course list page shows every course title without a leading number", async ({ page }) => {
  const numbered = /^\d+\s*·\s|^Pass \d+ /;
  const links = page.getByRole("main").getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const text = (await links.nth(i).innerText()).trim();
    expect(text).not.toMatch(numbered);
  }
});
