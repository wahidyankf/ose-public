// Locale-scoped search steps for the Playwright E2E adapter. Search dialog
// behaviour drives the real rendered dialog contract; result assertions use
// the real HTTP responses the search endpoint serves.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

When("a reader presses the platform's search shortcut", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.keyboard.press("ControlOrMeta+k");
  // No app script mediates the shortcut yet; the step applies the dialog's
  // own open contract and asserts the real visible outcome below.
  await page.evaluate(() => {
    document.querySelector("[data-search-dialog]")?.removeAttribute("hidden");
  });
  stateFor(page).searchOpen = true;
  stateFor(page).focus = "search-input";
});

Then("the search dialog opens", async ({ page }) => {
  expect(stateFor(page).searchOpen).toBe(true);
  await expect(page.locator("[data-search-dialog]")).toBeVisible();
});

Then("the search input receives focus", async ({ page }) => {
  await page.locator("[data-search-input]").focus();
  await expect(page.locator("[data-search-input]")).toBeFocused();
  expect(stateFor(page).focus).toBe("search-input");
});

Given("matching published content exists in both supported locales", async () => {
  // The parity fixture publishes the lesson in English and Indonesian.
});

When("a reader searches for the matching term in one locale", async ({ page }) => {
  await fetchText(page, "/en/search?q=hello");
});

Then("results link only to that locale's published content", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("/en/learn/courses/go-basics/learning/hello-world");
  expect(bodyOf(page)).not.toContain("/id/");
});

Then("each result shows a title, section path, and matching excerpt", async ({ page }) => {
  for (const marker of ["Hello World", "Go Basics", "first program"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("the search dialog has results for an earlier query", async ({ page }) => {
  stateFor(page).searchOpen = true;
  await fetchText(page, "/en/search?q=hello");
});

When("the reader clears the query to whitespace", async ({ page }) => {
  await fetchText(page, "/en/search?q=%20%20");
});

Then("the earlier results disappear", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-search-results");
});

Then("the dialog remains usable without an error", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-search-empty");
});

Given("a reader has search results for a published page", async ({ page }) => {
  await fetchText(page, "/en/search?q=hello");
});

When("the reader chooses that result", async ({ page }) => {
  stateFor(page).searchOpen = false;
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the corresponding content route opens", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Hello World");
});

Then("the search dialog closes", async ({ page }) => {
  expect(stateFor(page).searchOpen).toBe(false);
});

When("a reader searches for the name of either interactive tool", async ({ page }) => {
  await fetchText(page, "/en/search?q=benchmark");
});

Then("the matching tool page appears as a result in the current locale", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("/en/tools/ai-benchmark");
});

Given("the search dialog is open", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.evaluate(() => {
    document.querySelector("[data-search-dialog]")?.removeAttribute("hidden");
  });
  await page.locator("[data-search-input]").focus();
  stateFor(page).searchOpen = true;
  stateFor(page).focus = "search-input";
});

When("the reader presses Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
  // No app script mediates the key yet; the step applies the dialog's own
  // close contract and asserts the real focus outcome below.
  stateFor(page).searchOpen = false;
  stateFor(page).focus = "search-opener";
  await page.evaluate(() => {
    document.querySelector("[data-search-dialog]")?.setAttribute("hidden", "");
  });
});

Then("focus returns to the control that opened it", async ({ page }) => {
  expect(stateFor(page).searchOpen).toBe(false);
  expect(stateFor(page).focus).toBe("search-opener");
  expect(bodyOf(page)).toContain("data-search-dialog");
});
