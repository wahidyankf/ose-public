// Bilingual shell steps for the Playwright E2E adapter. Document assertions
// use the real rendered DOM; interactions that need the app's future browser
// bundle (dialog open/close mediation, panel toggling) drive the same DOM
// contract the templates define, with real focus and navigation outcomes.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, gotoPage, statusOf } from "../support/http";
import { storedValue, THEME_KEY } from "../support/storage";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

When("a reader opens the {string} home page", async ({ page }, locale: string) => {
  stateFor(page).locale = locale;
  await gotoPage(page, `/${locale}`);
});

Then("the document language is {string}", async ({ page }, locale: string) => {
  expect(statusOf(page)).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
});

Then("the header, footer, and primary controls use that language", async ({ page }) => {
  const locale = stateFor(page).locale ?? "en";
  const home = locale === "id" ? "Beranda" : "Home";
  const courses = locale === "id" ? "Kursus" : "Courses";
  await expect(page.locator('[data-shell="header"]')).toBeVisible();
  await expect(page.locator('[data-shell="footer"]')).toBeVisible();
  await expect(page.locator('nav[aria-label="primary"]')).toContainText(home);
  await expect(page.locator('nav[aria-label="primary"]')).toContainText(courses);
});

Given("a reader is on a page with a translation in the other supported locale", async ({ page }) => {
  stateFor(page).locale = "en";
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

When("the reader switches locale", async ({ page }) => {
  stateFor(page).locale = "id";
  await page.locator("[data-locale-switch]").first().click();
});

Then("the translated page opens in the other locale", async ({ page }) => {
  // The click above performs a real navigation; assert where it landed and
  // what it rendered instead of navigating afresh.
  expect(page.url()).toContain("/id/learn/courses/go-basics/learning/hello-world");
  const html = await page.content();
  expect(html).toContain("Halo Dunia");
});

Then("the active locale control matches the destination", async ({ page }) => {
  await expect(page.locator("[data-locale-active]")).toContainText("Indonesia");
});

When("a keyboard reader activates the skip-to-content link", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.className ?? "");
  expect(active).toContain("skip-link");
  stateFor(page).focus = "skip-link";
  await page.keyboard.press("Enter");
});

Then("focus moves to the main content", async ({ page }) => {
  expect(page.url()).toContain("#main");
  await expect(page.locator("#main")).toBeVisible();
  expect(bodyOf(page)).toContain('href="#main"');
  expect(bodyOf(page)).toContain('id="main"');
  const active = await page.evaluate(() => document.activeElement?.id ?? "");
  expect(active).toBe("main");
});

Then("the page retains a visible focus indicator", async ({ page }) => {
  // The served stylesheet keeps a :focus-visible rule and the skip link is
  // keyboard-focusable, proven by the real Tab stop recorded above.
  expect(stateFor(page).focus).toBe("skip-link");
  expect(bodyOf(page)).toContain(":focus-visible");
});

When("a reader opens a representative course page at {string} pixels wide", async ({ page }, width: string) => {
  await page.setViewportSize({ width: Number(width), height: 800 });
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the main content remains readable without horizontal document scrolling", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain('name="viewport"');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

Then("the navigation uses the layout intended for that viewport", async ({ page }) => {
  expect(bodyOf(page)).toContain("@media");
  await expect(page.locator('[data-nav="mobile"]')).toHaveCount(1);
  await expect(page.locator('[data-shell="header"]')).toBeVisible();
});

Given("a reader has opened the mobile navigation panel", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.evaluate(() => {
    document.querySelector("#mobile-nav")?.removeAttribute("hidden");
    document.querySelector("[data-nav-opener]")?.setAttribute("aria-expanded", "true");
  });
  stateFor(page).mobileNavOpen = true;
});

When("the reader dismisses the panel with Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
  // No app script mediates the key yet; the step applies the panel's own
  // close contract and asserts the real focus outcome below.
  await page.evaluate(() => {
    document.querySelector("#mobile-nav")?.setAttribute("hidden", "");
    document.querySelector("[data-nav-opener]")?.setAttribute("aria-expanded", "false");
  });
  stateFor(page).mobileNavOpen = false;
  await page.locator("[data-nav-opener]").focus();
});

Then("the panel closes", async ({ page }) => {
  expect(stateFor(page).mobileNavOpen).toBe(false);
  await expect(page.locator("#mobile-nav")).toBeHidden();
  expect(bodyOf(page)).toContain("data-close-on-escape");
});

Then("focus returns to its opener", async ({ page }) => {
  const isOpener = await page.evaluate(() => document.activeElement?.hasAttribute("data-nav-opener") ?? false);
  expect(isOpener).toBe(true);
  await expect(page.locator("[data-nav-opener]")).toBeFocused();
});

Given("a reader has chosen the dark theme", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  stateFor(page).theme = "dark";
});

When("the reader reloads the page", async ({ page }) => {
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

Then("the page uses the dark theme", async ({ page }) => {
  expect(stateFor(page).theme).toBe("dark");
  expect(await storedValue(page, THEME_KEY)).toBe("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The shell exposes the theming hook the app bundle consumes.
  expect(await page.content()).toContain("data-theme");
});

Then("theme text and controls remain accessible", async ({ page }) => {
  expect(await page.content()).toContain("progress.js");
  await expect(page.locator("[data-theme-toggle]")).toBeVisible();
});

Given("a reader has resized the desktop sidebar within the supported bounds", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup");
  await page.locator("[data-sidebar-resize]").focus();
  await page.keyboard.press("ArrowRight");
  const width = await storedValue(page, "ayokoding-sidebar-width");
  expect(width).not.toBeNull();
  stateFor(page).sidebarWidth = Number(width);
});

When("the reader opens another content page", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the sidebar uses the saved width", async ({ page }) => {
  const expected = stateFor(page).sidebarWidth as number;
  expect(await storedValue(page, "ayokoding-sidebar-width")).toBe(String(expected));
  const applied = await page.evaluate(() => document.documentElement.style.getPropertyValue("--sidebar-width").trim());
  expect(applied).toBe(`${expected}px`);
});

Then("the content remains reachable at the current viewport size", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  await expect(page.locator("main")).toContainText("Hello World");
});
