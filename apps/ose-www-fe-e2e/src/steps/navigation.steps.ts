import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

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

Then("breadcrumb text should wrap naturally without horizontal truncation", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const ol = breadcrumb.locator("ol");
  await expect(ol).toHaveCSS("flex-wrap", "wrap");
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
