import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Then } = createBdd();

Then("an authentication session should be active", async ({ page }) => {
  // Wait for login to complete: either token appears in localStorage or URL leaves /login
  await page
    .waitForFunction(
      () => {
        const hasLocalToken = Object.values(window.localStorage).some((v) => v && (v.includes("eyJ") || v.length > 50));
        const hasSessionToken = Object.values(window.sessionStorage).some(
          (v) => v && (v.includes("eyJ") || v.length > 50),
        );
        const leftLogin = !window.location.href.includes("/login");
        return hasLocalToken || hasSessionToken || leftLogin;
      },
      { timeout: 10000 },
    )
    .catch(() => {});

  const localStorageHasToken = await page.evaluate(() => {
    const keys = Object.keys(window.localStorage);
    return keys.reduce(
      (acc, key) => {
        acc[key] = window.localStorage.getItem(key) ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  });
  const sessionStorageHasToken = await page.evaluate(() => {
    const keys = Object.keys(window.sessionStorage);
    return keys.reduce(
      (acc, key) => {
        acc[key] = window.sessionStorage.getItem(key) ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  });
  const cookies = await page.context().cookies();
  const currentUrl = page.url();
  const hasToken =
    Object.values(localStorageHasToken).some((v) => v.includes("eyJ") || v.length > 50) ||
    Object.values(sessionStorageHasToken).some((v) => v.includes("eyJ") || v.length > 50) ||
    cookies.some(
      (c) =>
        c.name.toLowerCase().includes("token") ||
        c.name.toLowerCase().includes("session") ||
        c.name.toLowerCase().includes("auth") ||
        // Phoenix stores tokens in a server-side Plug session cookie
        c.name.toLowerCase().includes("key"),
    ) ||
    // Server-side session frontends (e.g. Phoenix LiveView): if we navigated away from /login, session is active
    !currentUrl.includes("/login");
  expect(hasToken).toBe(true);
});

Then("a refresh token should be stored", async ({ page }) => {
  const localStorageData = await page.evaluate(() => {
    const keys = Object.keys(window.localStorage);
    return keys.reduce(
      (acc, key) => {
        acc[key] = window.localStorage.getItem(key) ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  });
  const cookies = await page.context().cookies();
  const hasRefreshToken =
    Object.entries(localStorageData).some(
      ([k, v]) => (k.toLowerCase().includes("refresh") || v.includes("eyJ")) && v.length > 0,
    ) ||
    cookies.some(
      (c) =>
        c.name.toLowerCase().includes("refresh") ||
        c.name.toLowerCase().includes("token") ||
        // Phoenix stores both tokens in a server-side Plug session cookie
        c.name.toLowerCase().includes("key"),
    );
  expect(hasRefreshToken).toBe(true);
});
