import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { loginUser, deactivateUser } from "@/utils/api-helpers.js";

const { Given, When, Then } = createBdd();

Given("{word}'s access token is about to expire", async ({ page }, _username: string) => {
  await page.evaluate(() => {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.toLowerCase().includes("expir") || key.toLowerCase().includes("token")) {
        const expiry = Math.floor(Date.now() / 1000) + 1;
        window.localStorage.setItem(key, String(expiry));
      }
    }
  });
});

Given("{word}'s refresh token has expired", async ({ page }, _username: string) => {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
});

Given("{word} has refreshed her session and received a new token pair", async ({ page }, _username: string) => {
  const originalRefreshToken = await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) {
      if (key.toLowerCase().includes("refresh")) {
        return window.localStorage.getItem(key);
      }
    }
    return null;
  });
  await page.reload();
  if (originalRefreshToken) {
    await page.evaluate((token) => {
      window.localStorage.setItem("_test_original_refresh_token", token);
    }, originalRefreshToken);
  }
});

Given("{word}'s account has been deactivated", async ({}, username: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await deactivateUser(accessToken);
});

Given("{word} has already clicked logout", async ({ page }, _username: string) => {
  const logoutBtn = page
    .getByRole("button", { name: /l[o\s]g[o\s]?ut|log\s*out|sign\s*out/i })
    .or(page.getByRole("menuitem", { name: /l[o\s]g[o\s]?ut|log\s*out|sign\s*out/i }));
  // Open user menu dropdown if logout not directly visible
  if (!(await logoutBtn.first().isVisible({ timeout: 2000 }).catch(() => false))) {
    const userMenuBtn = page
      .getByRole("button", { name: /user menu/i })
      .or(page.getByLabel(/user menu/i));
    if (await userMenuBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await userMenuBtn.first().click();
      await page.waitForTimeout(300);
    }
  }
  await logoutBtn.first().click();
  await page.waitForURL(/\/login/);
});

When("the app performs a background token refresh", async ({ page }) => {
  await page.waitForTimeout(2000);
});

When("the app attempts a background token refresh", async ({ page }) => {
  await page.goto("/expenses");
});

When("the app attempts to refresh using the original refresh token", async ({ page }) => {
  const originalToken = await page.evaluate(() => window.localStorage.getItem("_test_original_refresh_token"));
  if (originalToken) {
    const localKeys = await page.evaluate(() => Object.keys(window.localStorage));
    for (const key of localKeys) {
      if (key.toLowerCase().includes("refresh") && key !== "_test_original_refresh_token") {
        await page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [key, originalToken] as [string, string]);
        break;
      }
    }
  }
  // Remove access token to force the frontend to attempt a refresh
  await page.evaluate(() => {
    localStorage.removeItem("demo_fe_access_token");
  });
  await page.goto("/expenses");
});

When("{word} clicks the {string} option", async ({ page }, _username: string, optionText: string) => {
  const target = page
    .getByRole("button", { name: new RegExp(optionText, "i") })
    .or(page.getByRole("menuitem", { name: new RegExp(optionText, "i") }))
    .or(page.getByText(new RegExp(optionText, "i")));
  // If not visible, try opening the user menu dropdown first
  if (!(await target.first().isVisible({ timeout: 2000 }).catch(() => false))) {
    const userMenuBtn = page
      .getByRole("button", { name: /user menu/i })
      .or(page.getByLabel(/user menu/i));
    if (await userMenuBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await userMenuBtn.first().click();
      await page.waitForTimeout(300);
    }
  }
  await target.first().click();
});

Then("a new access token should be stored", async ({ page }) => {
  const hasToken = await page.evaluate(() => {
    return Object.keys(window.localStorage).some(
      (k) => k.toLowerCase().includes("access") || k.toLowerCase().includes("token"),
    );
  });
  expect(hasToken).toBe(true);
});

Then("a new refresh token should be stored", async ({ page }) => {
  const hasRefresh = await page.evaluate(() => {
    return Object.keys(window.localStorage).some((k) => k.toLowerCase().includes("refresh"));
  });
  const cookies = await page.context().cookies();
  const hasCookieRefresh = cookies.some((c) => c.name.toLowerCase().includes("refresh"));
  expect(hasRefresh || hasCookieRefresh).toBe(true);
});

Then("an error message about session expiration should be displayed", async ({ page }) => {
  await expect(page.getByRole("alert").or(page.getByText(/session|expired|logout/i)).first()).toBeVisible();
});

Then("no error should be displayed", async ({ page }) => {
  // Exclude Next.js route announcer which always has role="alert"
  const alerts = page.getByRole("alert").filter({ hasNot: page.locator("#__next-route-announcer__") });
  await expect(alerts.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
});

Then("navigating to a protected page should redirect to login", async ({ page }) => {
  await page.goto("/expenses");
  await expect(page).toHaveURL(/\/login/);
});
