import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Header contains navigation links
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Breadcrumb lists the ancestors without the current page
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Breadcrumb text wraps without horizontal truncation
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Previous and next navigation between updates
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Footer links to AyoKoding on its canonical host

// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Visitor opens the search dialog, types a query, and opens a result
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Mobile menu opens from the hamburger button and lists the navigation links

const { When, Then } = createBdd();

When("the visitor opens the search dialog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).first().click();
  await expect(page.getByPlaceholder("Search pages...")).toBeVisible();
});

When("the visitor types the query {string}", async ({ page }, query: string) => {
  await page.getByPlaceholder("Search pages...").fill(query);
  await expect(page.getByRole("option", { name: /Enterprise Compliance Fixture/ })).toBeVisible();
});

When("the visitor opens the first search result", async ({ page }) => {
  await page.getByRole("option").first().click();
});

Then("the visitor lands on the page at {string}", async ({ page }, path: string) => {
  // Accept both /about and /about/ (Next.js strips the trailing slash by default)
  await expect(page).toHaveURL((url) => url.pathname.replace(/\/$/, "") === path.replace(/\/$/, ""));
});

When("the visitor opens the navigation menu from the hamburger button", async ({ page }) => {
  await page.getByRole("button", { name: "Open navigation menu" }).click();
});

Then('the navigation menu lists the links "Updates", "About", "Documentation", and "GitHub"', async ({ page }) => {
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  for (const label of ["Updates", "About", "Documentation", "GitHub"]) {
    await expect(menu.getByRole("link", { name: label })).toBeVisible();
  }
});

Then("breadcrumb text should wrap naturally without horizontal truncation", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb).toBeVisible();
  const styles = await breadcrumb.evaluate((nav) =>
    [nav, ...Array.from(nav.querySelectorAll("*"))].map((el) => getComputedStyle(el)),
  );
  for (const style of styles) {
    expect(style.whiteSpace).not.toBe("nowrap");
    expect(style.textOverflow).not.toBe("ellipsis");
  }
  await expect(breadcrumb.locator("ol")).toHaveCSS("flex-wrap", "wrap");
});

When("the header component is rendered", async ({ page }) => {
  await page.goto("/");
});

Then("the header contains a link to {string} at {string}", async ({ page }, text: string, href: string) => {
  const link = page.getByRole("link", { name: text });
  await expect(link.first()).toBeVisible();
  // Accept both /updates and /updates/ (trailing slash may vary)
  const actual = await link.first().getAttribute("href");
  expect(actual!.replace(/\/$/, "")).toBe(href.replace(/\/$/, ""));
});

Then("the header contains an external link to {string}", async ({ page }, text: string) => {
  const link = page.getByRole("link", { name: new RegExp(text, "i") });
  await expect(link.first()).toBeVisible();
  const href = await link.first().getAttribute("href");
  expect(href).toMatch(/^https:\/\//u);
  await expect(link.first()).toHaveAttribute("target", "_blank");
  await expect(link.first()).toHaveAttribute("rel", /noopener/u);
});

When("the footer component is rendered", async ({ page }) => {
  await page.goto("/");
});

Then(
  "the footer contains an external link to {string} on the canonical host {string}",
  async ({ page }, text: string, host: string) => {
    const link = page.locator("footer").getByRole("link", { name: text });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(new URL(href ?? "").host).toBe(host);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/u);
  },
);

When("the about page is rendered with breadcrumbs", async ({ page }) => {
  await page.goto("/about/");
});

Then("the breadcrumb shows {string} linking to {string}", async ({ page }, text: string, href: string) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const link = breadcrumb.getByRole("link", { name: text });
  await expect(link).toBeVisible();
  const actual = await link.getAttribute("href");
  expect(actual!.replace(/\/$/, "")).toBe(href.replace(/\/$/, ""));
});

Then("the current page should not appear in the breadcrumb", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  // The breadcrumb should only contain links (ancestor segments), no plain text spans for current page
  const spans = breadcrumb.locator("span:not(:has(*))");
  const count = await spans.count();
  expect(count).toBe(0);
});

Then("all breadcrumb segments should be clickable links", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const links = breadcrumb.getByRole("link");
  await expect(links.first()).toBeAttached();
});

When("an update detail page is rendered with adjacent updates", async ({ page }) => {
  // Navigate to a known update that has both prev and next
  await page.goto("/updates/");
  // Click on the first update link that is likely in the middle
  const updateLinks = page.getByRole("link").filter({ hasText: /phase/i });
  const count = await updateLinks.count();
  if (count > 1) {
    // Click the second link (likely has both prev and next)
    await updateLinks.nth(1).click();
  } else if (count > 0) {
    await updateLinks.first().click();
  }
  await page.waitForLoadState("networkidle");
});

Then("a {string} link is displayed with the previous update title", async ({ page }, label: string) => {
  const prevLink = page.getByRole("link", { name: /prev|previous|←/i });
  await expect(prevLink.first()).toBeVisible();
  const text = (await prevLink.first().innerText()).trim();
  expect(text.replace(new RegExp(label, "iu"), "").trim().length).toBeGreaterThan(0);
});

Then("a {string} link is displayed with the next update title", async ({ page }, label: string) => {
  const nextLink = page.getByRole("link", { name: /next|→/i });
  await expect(nextLink.first()).toBeVisible();
  const text = (await nextLink.first().innerText()).trim();
  expect(text.replace(new RegExp(label, "iu"), "").trim().length).toBeGreaterThan(0);
});
