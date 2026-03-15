import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import {
  registerUser,
  loginUser,
  promoteToAdmin,
  lockUserByBruteForce,
  unlockUser,
  getUserByUsername,
} from "@/utils/api-helpers.js";

const { Given, Then } = createBdd();

Given("alice has entered the wrong password the maximum number of times", async ({}) => {
  await lockUserByBruteForce("alice", "Str0ng#Pass1");
});

Given("a user {string} is registered and locked after too many failed logins", async ({}, username: string) => {
  await registerUser(username, `${username}@example.com`, "Str0ng#Pass1");
  await lockUserByBruteForce(username, "Str0ng#Pass1");
});

Given("a user {string} was locked and has been unlocked by an admin", async ({}, username: string) => {
  await registerUser(username, `${username}@example.com`, "Str0ng#Pass1");
  await lockUserByBruteForce(username, "Str0ng#Pass1");
  const adminUsername = "unlock-admin-" + Date.now();
  await registerUser(adminUsername, `${adminUsername}@example.com`, "Str0ng#Pass1");
  await promoteToAdmin(adminUsername);
  const { accessToken: adminToken } = await loginUser(adminUsername, "Str0ng#Pass1");
  const user = await getUserByUsername(adminToken, username);
  await unlockUser(adminToken, user.id);
});

// "When the admin clicks the {string} button" is in admin-panel.steps.ts

Then("an error message about account lockout should be displayed", async ({ page }) => {
  await expect(page.getByText(/locked|too many attempts|account locked/i)).toBeVisible();
});

Then("the error should mention minimum length requirements", async ({ page }) => {
  await expect(page.getByText(/minimum|at least|characters|length/i)).toBeVisible();
});

Then("the error should mention special character requirements", async ({ page }) => {
  await expect(page.getByText(/special character|symbol|!|@|#/i)).toBeVisible();
});
