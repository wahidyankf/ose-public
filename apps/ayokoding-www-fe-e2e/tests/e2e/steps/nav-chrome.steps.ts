import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Viewport helpers
// ---------------------------------------------------------------------------

Given("the viewport is set to desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

Given("the viewport is set to mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
});

// ---------------------------------------------------------------------------
// Mobile navigation
// ---------------------------------------------------------------------------

When("the visitor opens the mobile navigation menu", async ({ page }) => {
  const hamburger = page.getByRole("button", { name: "Open navigation menu" });
  await hamburger.click();
});

// ---------------------------------------------------------------------------
// Header primary nav assertions
// ---------------------------------------------------------------------------

Then(
  "the header primary nav should contain a link to {string} labelled {string}",
  async ({ page }, href: string, label: string) => {
    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    await expect(primaryNav).toBeVisible();
    const link = primaryNav.getByRole("link", { name: label });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  },
);

// ---------------------------------------------------------------------------
// Mobile nav assertions
// ---------------------------------------------------------------------------

Then(
  "the mobile nav should contain a link to {string} labelled {string}",
  async ({ page }, href: string, label: string) => {
    const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav).toBeVisible();
    // The drawer holds BOTH the primary chrome links (Learn -> /{locale}/c,
    // Tools -> /{locale}/tools) and the content SidebarTree, which can contain
    // its own "Learn" content node. Disambiguate by intersecting the accessible
    // name with the exact chrome href so we always target the chrome link.
    const link = mobileNav.getByRole("link", { name: label }).and(mobileNav.locator(`a[href="${href}"]`));
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  },
);

// The drawer's primary-nav labels in each locale, as the chrome renders them.
const DRAWER_PRIMARY_LABELS: Record<string, { learn: string; tools: string }> = {
  en: { learn: "Learn", tools: "Tools" },
  id: { learn: "Belajar", tools: "Alat" },
};

Then("every drawer label is localized to {string}", async ({ page }, locale: string) => {
  const labels = DRAWER_PRIMARY_LABELS[locale];
  if (labels === undefined) throw new Error(`unknown drawer locale: ${locale}`);
  const drawer = page.getByRole("dialog");
  await expect(drawer).toContainText(labels.learn);
  await expect(drawer).toContainText(labels.tools);
  if (locale !== "en") await expect(drawer).not.toContainText(/^Learn$|^Tools$/);
});

// ---------------------------------------------------------------------------
// Footer nav assertions
//
// Column headings are localized (e.g. "Belajar" for "Learn" in Indonesian), so
// we identify each column by the destination link it contains rather than by its
// heading text.  The "Learn" column always contains a link to /{locale}/c; the
// "Tools" column to /{locale}/tools; the "About" column to the about/terms pages.
// ---------------------------------------------------------------------------

/**
 * Map of concept column name → href fragment(s) that identify a link within
 * that column.  "About" covers both English ("about-ayokoding") and Indonesian
 * ("tentang-ayokoding") slugs.
 */
const FOOTER_COLUMN_HREF_FRAGMENT: Record<string, string> = {
  Learn: "/c",
  Tools: "/tools",
  About: "ayokoding",
};

Then("the footer should display a {string} column", async ({ page }, columnName: string) => {
  const footer = page.getByRole("navigation", { name: "Footer" });
  await expect(footer).toBeVisible();
  // Verify the column exists by finding at least one link whose href matches the column's
  // canonical path fragment.
  const fragment = FOOTER_COLUMN_HREF_FRAGMENT[columnName] ?? columnName.toLowerCase();
  const link = footer.locator(`a[href*="${fragment}"]`).first();
  await expect(link).toBeVisible();
});

Then("the footer should display an {string} column", async ({ page }, columnName: string) => {
  const footer = page.getByRole("navigation", { name: "Footer" });
  await expect(footer).toBeVisible();
  const fragment = FOOTER_COLUMN_HREF_FRAGMENT[columnName] ?? columnName.toLowerCase();
  const link = footer.locator(`a[href*="${fragment}"]`).first();
  await expect(link).toBeVisible();
});

Then("the footer {string} column should link to {string}", async ({ page }, _columnName: string, href: string) => {
  const footer = page.getByRole("navigation", { name: "Footer" });
  await expect(footer).toBeVisible();
  const link = footer.locator(`a[href="${href}"]`);
  await expect(link).toBeVisible();
});
