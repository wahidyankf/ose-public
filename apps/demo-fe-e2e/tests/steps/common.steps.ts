/**
 * Common step definitions shared across multiple feature files.
 * Domain-specific steps that appear in only one feature domain belong in their
 * respective domain step files.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import {
  registerUser,
  loginUser,
  deactivateUser,
  promoteToAdmin,
  createExpense,
  disableUser,
  getUserByUsername,
} from "@/utils/api-helpers.js";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// App startup / background
// ---------------------------------------------------------------------------

Given("the app is running", async ({}) => {
  // DB reset is handled by the Before hook in global-setup.ts
});

// ---------------------------------------------------------------------------
// User registration helpers (Given for setup)
// ---------------------------------------------------------------------------

Given("a user {string} is registered with password {string}", async ({}, username: string, password: string) => {
  await registerUser(username, `${username}@example.com`, password);
});

Given(
  "a user {string} is registered with email {string} and password {string}",
  async ({}, username: string, email: string, password: string) => {
    await registerUser(username, email, password);
  },
);

Given("a user {string} is registered and deactivated", async ({}, username: string) => {
  await registerUser(username, `${username}@example.com`, "Str0ng#Pass1");
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await deactivateUser(accessToken);
});

// ---------------------------------------------------------------------------
// Login helpers
// ---------------------------------------------------------------------------

Given("{word} has logged in", async ({ page }, username: string) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByRole("textbox", { name: /password/i }).fill("Str0ng#Pass1");
  await page.getByRole("button", { name: /log in|sign in|login/i }).click();
  await page.waitForURL((url) => !url.includes("/login"));
});

Given("{word} has logged out", async ({ page }) => {
  const logoutBtn = page
    .getByRole("button", { name: /logout|log out|sign out/i })
    .or(page.getByRole("link", { name: /logout|log out|sign out/i }));
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/\/login/);
  }
});

// ---------------------------------------------------------------------------
// Admin setup
// ---------------------------------------------------------------------------

Given("an admin user {string} is logged in", async ({ page }, adminUsername: string) => {
  await registerUser(adminUsername, `${adminUsername}@example.com`, "Str0ng#Pass1");
  await promoteToAdmin(adminUsername);
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(adminUsername);
  await page.getByRole("textbox", { name: /password/i }).fill("Str0ng#Pass1");
  await page.getByRole("button", { name: /log in|sign in|login/i }).click();
  await page.waitForURL((url) => !url.includes("/login"));
});

// ---------------------------------------------------------------------------
// Login form submission (When)
// ---------------------------------------------------------------------------

When(
  "{word} submits the login form with username {string} and password {string}",
  async ({ page }, _actor: string, username: string, password: string) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /username/i }).fill(username);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /log in|sign in|login/i }).click();
  },
);

// ---------------------------------------------------------------------------
// Common "clicks the X button" (shared across session, profile, etc.)
// ---------------------------------------------------------------------------

When("{word} clicks the {string} button", async ({ page }, _username: string, buttonText: string) => {
  await page.getByRole("button", { name: new RegExp(buttonText, "i") }).click();
});

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

When("{word} navigates to a protected page", async ({ page }) => {
  await page.goto("/expenses");
});

When("{word} navigates to the login page", async ({ page }) => {
  await page.goto("/login");
});

When("{word} navigates to the dashboard", async ({ page }) => {
  await page.goto("/expenses");
});

When("{word} navigates to the entry list page", async ({ page }) => {
  await page.goto("/expenses");
});

When("{word} navigates to the new entry form", async ({ page }) => {
  await page.goto("/expenses/new");
});

When("{word} navigates to the profile page", async ({ page }) => {
  await page.goto("/profile");
});

When("{word} navigates to the reporting page", async ({ page }) => {
  await page.goto("/reporting");
});

When("{word} navigates to the change password form", async ({ page }) => {
  await page.goto("/profile");
  const changePasswordLink = page
    .getByRole("link", { name: /change password/i })
    .or(page.getByRole("button", { name: /change password/i }));
  await changePasswordLink.click();
});

When("{word} navigates to {word}'s entry detail", async ({ page }, _viewer: string, _owner: string) => {
  await page.goto("/expenses");
  const bobEntry = page.getByText("Taxi").or(page.getByText("Bob's entry"));
  await bobEntry.first().click();
});

When("the admin navigates to the user management page", async ({ page }) => {
  await page.goto("/admin/users");
});

When("the admin navigates to {word}'s user detail page", async ({ page }, username: string) => {
  await page.goto("/admin/users");
  const searchInput = page.getByRole("textbox", { name: /search/i }).or(page.getByPlaceholder(/search/i));
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill(username);
    await page.keyboard.press("Enter");
  }
  await page.getByText(username).first().click();
});

When("the admin navigates to {word}'s user detail in the admin panel", async ({ page }, username: string) => {
  await page.goto("/admin/users");
  const searchInput = page.getByRole("textbox", { name: /search/i }).or(page.getByPlaceholder(/search/i));
  await searchInput.fill(username);
  await page.keyboard.press("Enter");
  await page.getByText(username).first().click();
});

// ---------------------------------------------------------------------------
// Entry creation helpers (Given - API-based)
// ---------------------------------------------------------------------------

Given(
  "{word} has created an entry with amount {string}, currency {string}, category {string}, description {string}, date {string}, and type {string}",
  async (
    {},
    username: string,
    amount: string,
    currency: string,
    category: string,
    description: string,
    date: string,
    type: string,
  ) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency,
      category,
      description,
      date,
      type,
    });
  },
);

Given("{word} has created 3 entries", async ({}, username: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  for (let i = 0; i < 3; i++) {
    await createExpense(accessToken, {
      amount: `${(i + 1) * 10}.00`,
      currency: "USD",
      category: "food",
      description: `Entry ${i + 1}`,
      date: "2025-01-15",
      type: "expense",
    });
  }
});

Given("{word} has created an entry with description {string}", async ({}, username: string, description: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await createExpense(accessToken, {
    amount: "10.00",
    currency: "USD",
    category: "food",
    description,
    date: "2025-01-15",
    type: "expense",
  });
});

// ---------------------------------------------------------------------------
// Common entry form interactions
// ---------------------------------------------------------------------------

When("{word} submits the entry form", async ({ page }) => {
  await page.getByRole("button", { name: /submit|save|create|add entry/i }).click();
});

When("{word} confirms the deletion", async ({ page }) => {
  await page.getByRole("button", { name: /confirm|yes|delete/i }).click();
});

When("{word} opens the entry detail for {string}", async ({ page }, _username: string, description: string) => {
  await page.goto("/expenses");
  await page.getByText(description).first().click();
});

When("{word} opens the session info panel", async ({ page }) => {
  const tokensLink = page.getByRole("link", { name: /^tokens$/i });
  if (await tokensLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tokensLink.click();
  } else {
    await page.goto("/tokens");
  }
});

// ---------------------------------------------------------------------------
// Common assertions
// ---------------------------------------------------------------------------

Then("{word} should be on the dashboard page", async ({ page }) => {
  await expect(page).not.toHaveURL(/\/login/);
});

Then("{word} should be redirected to the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("{word} should remain on the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("the navigation should display {word}'s username", async ({ page }, username: string) => {
  await expect(page.getByText(username)).toBeVisible();
});

Then("an error message about invalid credentials should be displayed", async ({ page }) => {
  await expect(page.getByRole("alert").or(page.getByText(/invalid|incorrect|wrong|credentials/i))).toBeVisible();
});

Then("an error message about account deactivation should be displayed", async ({ page }) => {
  await expect(page.getByRole("alert").or(page.getByText(/deactivat|inactive|disabled/i))).toBeVisible();
});

Then("an error message about account being disabled should be displayed", async ({ page }) => {
  await expect(page.getByRole("alert").or(page.getByText(/disabled|suspended|access denied/i))).toBeVisible();
});

Then("the authentication session should be cleared", async ({ page }) => {
  const hasToken = await page.evaluate(() => {
    return Object.values(window.localStorage).some((v) => v?.includes("eyJ"));
  });
  expect(hasToken).toBe(false);
});

Then("{word}'s status should display as {string}", async ({ page }, _username: string, status: string) => {
  await expect(page.getByText(new RegExp(status, "i"))).toBeVisible();
});

Then("the entry list should contain an entry with description {string}", async ({ page }, description: string) => {
  await page.goto("/expenses");
  await expect(page.getByText(description)).toBeVisible();
});

Then("the entry list should not contain an entry with description {string}", async ({ page }, description: string) => {
  await expect(page.getByText(description)).not.toBeVisible();
});

Then("the entry list should display pagination controls", async ({ page }) => {
  await expect(
    page
      .getByRole("navigation", { name: /pagination/i })
      .or(page.getByTestId("pagination"))
      .or(page.getByRole("button", { name: /next|previous/i })),
  ).toBeVisible();
});

Then("a validation error for the password field should be displayed", async ({ page }) => {
  await expect(
    page
      .getByText(/password.*required|weak password|password.*too short|invalid password|password must/i)
      .or(page.getByText(/at least 12 characters|at least one special character/i)),
  ).toBeVisible();
});

Then("the visitor should remain on the registration page", async ({ page }) => {
  await expect(page).toHaveURL(/\/register/);
});

When(
  "a visitor fills in the registration form with username {string}, email {string}, and password {string}",
  async ({ page }, username: string, email: string, password: string) => {
    await page.goto("/register");
    await page.getByRole("textbox", { name: /username/i }).fill(username);
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
  },
);

When("the visitor submits the registration form", async ({ page }) => {
  await page.getByRole("button", { name: /register|sign up|create account/i }).click();
});

Then("the visitor should be on the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("the health status indicator should display {string}", async ({ page }, status: string) => {
  await expect(page.getByTestId("health-status").or(page.getByText(status))).toBeVisible();
  await expect(page.getByTestId("health-status").or(page.getByText(status))).toContainText(status);
});

// Used in admin panel + responsive
Given("a user {string} is logged in", async ({ page }, username: string) => {
  await registerUser(username, `${username}@example.com`, "Str0ng#Pass1");
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByRole("textbox", { name: /password/i }).fill("Str0ng#Pass1");
  await page.getByRole("button", { name: /log in|sign in|login/i }).click();
  await page.waitForURL((url) => !url.includes("/login"));
});

// Used in admin + token-management
Given("{word}'s account has been disabled by the admin", async ({}, username: string) => {
  const adminUsername = "admin-disable-" + Date.now();
  await registerUser(adminUsername, `${adminUsername}@example.com`, "Str0ng#Pass1");
  await promoteToAdmin(adminUsername);
  const { accessToken: adminToken } = await loginUser(adminUsername, "Str0ng#Pass1");
  const user = await getUserByUsername(adminToken, username);
  await disableUser(adminToken, user.id, "Admin test disable");
});

// Used in token-management and admin
Given("an admin has disabled {word}'s account", async ({}, username: string) => {
  const adminUsername = "token-admin-" + Date.now();
  await registerUser(adminUsername, `${adminUsername}@example.com`, "Str0ng#Pass1");
  await promoteToAdmin(adminUsername);
  const { accessToken: adminToken } = await loginUser(adminUsername, "Str0ng#Pass1");
  const user = await getUserByUsername(adminToken, username);
  await disableUser(adminToken, user.id, "Token test disable");
});
