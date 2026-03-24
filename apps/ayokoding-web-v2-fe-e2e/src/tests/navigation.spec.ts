import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("sidebar is present on a content page", async ({ page }) => {
    await page.goto("/en/learn/overview");

    const sidebar = page.getByRole("navigation", { name: /sidebar/i });
    await expect(sidebar).toBeVisible();
  });

  test("breadcrumb is present on a content page", async ({ page }) => {
    await page.goto("/en/learn/overview");

    // Breadcrumb navigation helps users understand their location in the site
    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(breadcrumb).toBeVisible();
  });

  test("table of contents is present on desktop", async ({ page }) => {
    // Desktop viewport is already the default for chromium/firefox/webkit projects
    await page.goto("/en/learn/overview");

    const toc = page.getByRole("navigation", { name: /table of contents/i });
    await expect(toc).toBeVisible();
  });
});
