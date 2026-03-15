import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import {
  registerUser,
  loginUser,
  promoteToAdmin,
  disableUser,
  enableUser,
  getUserByUsername,
} from "@/utils/api-helpers.js";

const { Given, When, Then } = createBdd();

Given(
  "users {string}, {string}, and {string} are registered",
  async ({}, user1: string, user2: string, user3: string) => {
    await registerUser(user1, `${user1}@example.com`, "Str0ng#Pass1");
    await registerUser(user2, `${user2}@example.com`, "Str0ng#Pass1");
    await registerUser(user3, `${user3}@example.com`, "Str0ng#Pass1");
  },
);

Given("{word}'s account has been disabled", async ({}, username: string) => {
  const adminUsername = "admin-disable2-" + Date.now();
  await registerUser(adminUsername, `${adminUsername}@example.com`, "Str0ng#Pass1");
  await promoteToAdmin(adminUsername);
  const { accessToken: adminToken } = await loginUser(adminUsername, "Str0ng#Pass1");
  const user = await getUserByUsername(adminToken, username);
  await disableUser(adminToken, user.id, "Admin test disable");
});

When("the admin types {string} in the search field", async ({ page }, searchTerm: string) => {
  const searchInput = page.getByRole("textbox", { name: /search/i }).or(page.getByPlaceholder(/search/i));
  await searchInput.fill(searchTerm);
  await page.keyboard.press("Enter");
});

When(
  "the admin clicks the {string} button with reason {string}",
  async ({ page }, buttonText: string, reason: string) => {
    await page.getByRole("button", { name: new RegExp(buttonText, "i") }).first().click();
    const reasonInput = page.getByRole("textbox", { name: /reason/i }).or(page.getByLabel(/reason/i));
    if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonInput.fill(reason);
    }
    // Click confirm button inside the alertdialog
    const dialog = page.getByRole("alertdialog");
    const confirmBtn = dialog.getByRole("button", { name: /confirm|submit|disable|yes/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    // Wait for dialog to close before returning
    await dialog.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  },
);

When("the admin clicks the {string} button", async ({ page }, buttonText: string) => {
  await page.getByRole("button", { name: new RegExp(buttonText, "i") }).click();
  const confirmBtn = page.getByRole("button", {
    name: /confirm|submit|yes|ok/i,
  });
  if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmBtn.click();
  }
});

When("{word} attempts to access the dashboard", async ({ page }) => {
  await page.goto("/expenses");
});

Then("the user list should display registered users", async ({ page }) => {
  await expect(page.getByRole("table").first()).toBeVisible();
  const rows = page.getByRole("row");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
});

Then("the list should include pagination controls", async ({ page }) => {
  await expect(
    page
      .getByRole("navigation", { name: /pagination/i })
      .or(page.getByTestId("pagination"))
      .or(page.getByText(/page \d+ of \d+/i))
      .or(page.getByRole("button", { name: /next|previous/i }))
      .first(),
  ).toBeVisible();
});

Then("the list should display total user count", async ({ page }) => {
  await expect(page.getByText(/total|count|\d+ users/i)).toBeVisible();
});

Then("the user list should display only users matching {string}", async ({ page }, searchTerm: string) => {
  await expect(page.getByText(searchTerm)).toBeVisible();
});

Then("a password reset token should be displayed", async ({ page }) => {
  await expect(page.getByTestId("reset-token").first()).toBeVisible();
});

Then("a copy-to-clipboard button should be available", async ({ page }) => {
  await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
});

void loginUser;
void promoteToAdmin;
void disableUser;
void enableUser;
void getUserByUsername;
