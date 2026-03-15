import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("{word} has deactivated her account", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: /deactivate account/i }).click();
  await page.getByRole("button", { name: /confirm|yes|deactivate/i }).click();
  await page.waitForURL(/\/login/);
});

When("{word} changes the display name to {string}", async ({ page }, _username: string, displayName: string) => {
  const input = page.getByRole("textbox", { name: /display name/i }).or(page.getByLabel(/display name/i));
  await input.fill(displayName);
});

When("{word} saves the profile changes", async ({ page }) => {
  await page.getByRole("button", { name: /save|update/i }).click();
});

When(
  "{word} enters old password {string} and new password {string}",
  async ({ page }, _username: string, oldPassword: string, newPassword: string) => {
    // password inputs are not role="textbox" - use id-based locators for reliability
    await page.locator("#oldPassword").fill(oldPassword);
    await page.locator("#newPassword").fill(newPassword);
  },
);

When("{word} submits the password change", async ({ page }) => {
  await page
    .getByRole("button", {
      name: /change password|update password|save/i,
    })
    .first()
    .click();
});

When("{word} confirms the deactivation", async ({ page }) => {
  await page.getByRole("button", { name: /confirm|yes|deactivate/i }).click();
});

Then("the profile should display username {string}", async ({ page }, username: string) => {
  await expect(page.getByText(username).first()).toBeVisible();
});

Then("the profile should display email {string}", async ({ page }, email: string) => {
  await expect(page.getByText(email)).toBeVisible();
});

Then("the profile should display a display name", async ({ page }) => {
  await expect(page.getByLabel(/display name/i).or(page.getByTestId("display-name"))).toBeVisible();
});

Then("the profile should display display name {string}", async ({ page }, displayName: string) => {
  await expect(page.getByText(displayName)).toBeVisible();
});

Then("a success message about password change should be displayed", async ({ page }) => {
  await expect(
    page
      .getByRole("alert")
      .filter({ hasNot: page.locator("#__next-route-announcer__") })
      .first()
      .or(page.getByText(/password changed|success/i).first()),
  ).toBeVisible();
});
