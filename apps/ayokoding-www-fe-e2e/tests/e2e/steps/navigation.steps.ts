import { createBdd } from "playwright-bdd";
import { expect, type Locator, type Page, type Response } from "@playwright/test";

const { Given, When, Then } = createBdd();
const navigationResponses = new WeakMap<Page, Response>();

When("a visitor navigates to {string}", async ({ page }, url: string) => {
  const response = await page.goto(url);
  expect(response, `navigation to ${url} should return an HTTP response`).not.toBeNull();
  navigationResponses.set(page, response!);
});

Then("the page should respond with HTTP 200", async ({ page }) => {
  const response = navigationResponses.get(page);
  expect(response, "the navigation step should capture its main-document response").toBeDefined();
  expect(response!.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("article")).toBeVisible();
});

Then("the page should contain a heading with text {string}", async ({ page }, headingText: string) => {
  await expect(page.getByRole("heading", { name: headingText })).toBeVisible();
});

When("a visitor opens a content page that has child sections", async ({ page }) => {
  await page.goto("/en/learn/courses");
  await page.waitForLoadState("networkidle");
});

Then("the sidebar should display the section tree", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  await expect(sidebar).toBeVisible();
});

Then("parent nodes should be expandable and collapsible", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  await expect(sidebar.getByRole("button", { name: /Expand section|Collapse section/ }).first()).toBeVisible();
});

When("the visitor clicks a collapsed parent node", async ({ page }) => {
  const button = page
    .getByRole("navigation", { name: /sidebar/i })
    .getByRole("button", { name: "Expand section" })
    .first();
  await expect(button).toBeVisible();
  await button.evaluate((node) => node.setAttribute("data-e2e-expanded-node", "true"));
  await button.click();
  await expect(page.locator('[data-e2e-expanded-node="true"]')).toHaveAttribute("aria-label", "Collapse section");
});

Then("its child items should become visible", async ({ page }) => {
  const expanded = page.locator('[data-e2e-expanded-node="true"]');
  await expect(expanded.locator("xpath=ancestor::li[1]//ul").first()).toBeVisible();
});

When("a visitor opens a nested content page", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python/learning/beginner");
  await page.waitForLoadState("networkidle");
});

Then("a breadcrumb trail should be displayed above the page title", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await expect(breadcrumb).toBeVisible();
});

Then("each breadcrumb segment should reflect an ancestor level of the URL hierarchy", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const visibleHrefs = await breadcrumb
    .locator("a:visible")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(visibleHrefs).toEqual([
    "/en",
    "/en/browse",
    "/en/learn",
    "/en/learn/courses",
    "/en/learn/courses/just-enough-python",
    "/en/learn/courses/just-enough-python/learning",
  ]);
});

Then("the current page should not appear in the breadcrumb", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await expect(breadcrumb.getByText("Beginner Examples", { exact: true })).toHaveCount(0);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(0);
});

Then("all breadcrumb segments should be clickable links", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const links = breadcrumb.getByRole("link");
  expect(await links.count()).toBeGreaterThan(1);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", /^\/en(?:\/|$)/);
  }
});

Then("the breadcrumb should render on a single row without horizontally truncating link text", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const ol = breadcrumb.locator("ol");
  // DWT-001: the breadcrumb no longer wraps to multiple rows; middle crumbs collapse to a
  // single ellipsis at mobile width instead (see prd.md Screen 4, "no multi-line wrap at 375px").
  await expect(ol).toHaveCSS("flex-wrap", "nowrap");
});

When("a visitor opens a content page with multiple headings", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/learn/courses/just-enough-python/learning/beginner");
  await page.waitForLoadState("networkidle");
});

Then("a table of contents should be visible on the page", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
});

Then("the table of contents should list all H2, H3, and H4 headings as anchor links", async ({ page }) => {
  const articleHeadings = page.getByRole("article").locator("h2[id], h3[id], h4[id]");
  const tocLinks = page.getByRole("navigation", { name: "Table of contents" }).getByRole("link");
  expect(await articleHeadings.count()).toBeGreaterThan(0);
  await expect(tocLinks).toHaveCount(await articleHeadings.count());
  for (const heading of await articleHeadings.all()) {
    const id = await heading.getAttribute("id");
    await expect(tocLinks.filter({ hasText: (await heading.textContent()) ?? "" }).first()).toHaveAttribute(
      "href",
      `#${id}`,
    );
  }
});

Then("H1 headings should not appear in the table of contents", async ({ page }) => {
  const h1Text = await page.getByRole("article").getByRole("heading", { level: 1 }).textContent();
  await expect(
    page.getByRole("navigation", { name: "Table of contents" }).getByRole("link", { name: h1Text ?? "" }),
  ).toHaveCount(0);
});

When("a visitor is on a content page that has sibling pages", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python/learning/beginner");
  await page.waitForLoadState("networkidle");
});

Then("a previous link should point to the preceding sibling page", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  await expect(navigation.getByRole("link", { name: /Overview/i })).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-python/learning/overview",
  );
});

Then("a next link should point to the following sibling page", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  await expect(navigation.getByRole("link", { name: /Intermediate Examples/i })).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-python/learning/intermediate",
  );
});

When("the visitor clicks the next link", async ({ page }) => {
  await page
    .getByRole("navigation", { name: "Page navigation" })
    .getByRole("link", { name: /Intermediate Examples/i })
    .click();
});

Then("they should be taken to the next sibling page", async ({ page }) => {
  await expect(page).toHaveURL(/\/en\/learn\/courses\/just-enough-python\/learning\/intermediate$/);
  await expect(page.getByRole("heading", { level: 1, name: /Intermediate/i })).toBeVisible();
});

When("a visitor is on a specific content page", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python/learning/beginner");
  await page.waitForLoadState("networkidle");
});

Then("the corresponding item in the sidebar should be visually highlighted as active", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  const active = sidebar.locator('a[href="/en/learn/courses/just-enough-python/learning/beginner"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveClass(/bg-primary\/5/);
  await expect(active).toHaveClass(/font-medium/);
  await expect(active).toHaveClass(/text-primary/);
});

Then("no other sidebar item should be highlighted as active", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  await expect(sidebar.locator("a.bg-primary\\/5.font-medium.text-primary")).toHaveCount(1);
});

Given("a content page's markdown body contains a relative link to another content file", async ({ page }) => {
  await page.goto("/en/learn/courses/actor-model-concurrency/overview");
  await page.waitForLoadState("networkidle");
});

When("the page is rendered to HTML", async ({ page }) => {
  await expect(page.getByRole("article")).toBeVisible();
});

Then("the rendered link's href should be the linked page's real site URL", async ({ page }) => {
  await expect(page.getByRole("article").getByRole("link", { name: "Just Enough Elixir" }).first()).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-elixir/learning/overview",
  );
});

Then('the href should not contain a literal ".md" extension', async ({ page }) => {
  const href = await page
    .getByRole("article")
    .getByRole("link", { name: "Just Enough Elixir" })
    .first()
    .getAttribute("href");
  expect(href).not.toContain(".md");
});

Then("the href should not be a raw filesystem-relative path", async ({ page }) => {
  const href = await page
    .getByRole("article")
    .getByRole("link", { name: "Just Enough Elixir" })
    .first()
    .getAttribute("href");
  expect(href).not.toMatch(/^\.\.?(?:\/|$)/);
});

// The three sidebar entries under Learn, by their public hrefs — the section indexes, since the
// Learn home replaced the retired overview page (U1, plan ayokoding-learn-revamp-04).
const learnSidebarHrefs = ["/en/learn/paths", "/en/learn/courses", "/en/learn/legacy"] as const;

/**
 * The docs sidebar's desktop `<aside>` (resizable-sidebar.tsx) — the `md:block` shell the
 * generic sidebar tree renders inside. Below `md` the aside is display:none, so every
 * lookup here is scoped to the desktop rail only.
 */
function desktopSidebarAside(page: Page): Locator {
  return page.locator("aside").filter({ has: page.getByRole("navigation", { name: /sidebar/i }) });
}

/**
 * The Learn sidebar entries positioned top to bottom on the page: each entry's `href` with
 * the `y` of its `boundingBox()`, sorted ascending. The sidebar renders its entries in
 * content-tree weight order, so the y sequence is the rendered order.
 */
async function learnSidebarEntriesTopToBottom(aside: Locator): Promise<Array<{ href: string; y: number }>> {
  const entries: Array<{ href: string; y: number }> = [];
  for (const href of learnSidebarHrefs) {
    const link = aside.locator(`a[href="${href}"]`);
    await expect(link, `the Learn sidebar entry ${href} should render in the desktop aside`).toBeVisible();
    const box = await link.boundingBox();
    expect(box, `the Learn sidebar entry ${href} should expose a bounding box`).not.toBeNull();
    entries.push({ href, y: box!.y });
  }
  return entries.sort((a, b) => a.y - b.y);
}

When("a visitor opens the Learn home", async ({ page }) => {
  await page.goto("/en/learn");
  await page.waitForLoadState("networkidle");
});

Then(
  "the entries under Learn in the sidebar are {string}, {string}, and {string} in that order",
  async ({ page }, first: string, second: string, third: string) => {
    const aside = desktopSidebarAside(page);
    const entries = await learnSidebarEntriesTopToBottom(aside);
    expect(
      entries.map((entry) => entry.href),
      `the Learn sidebar entries should read ${first}, ${second}, ${third} top to bottom, but the rendered y-order was: ${entries
        .map((entry) => `${entry.href}@y=${entry.y}`)
        .join(", ")}`,
    ).toEqual([...learnSidebarHrefs]);
    // The order and the visible labels both come from the rendered rail, so a wrong title paired
    // with the right slot cannot pass.
    for (const [index, expectedTitle] of [first, second, third].entries()) {
      await expect(aside.locator(`a[href="${learnSidebarHrefs[index]}"]`)).toHaveText(expectedTitle);
    }
  },
);
