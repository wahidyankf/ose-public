import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import * as fs from "fs/promises";
import * as path from "path";

const { Given, When, Then, Before, After } = createBdd();

const MEMBERS_PATH = path.join(process.cwd(), "../organiclever-web/src/data/members.json");

const ORIGINAL_MEMBERS = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "Senior Software Engineers",
    email: "alice@example.com",
    github: "alicejohnson",
  },
  { id: 2, name: "Bob Smith", role: "Product Manager", github: "bobsmith" },
  {
    id: 3,
    name: "Charlie Davis",
    role: "UX Designer",
    email: "charlie@example.com",
    github: "charliedavis",
  },
  { id: 4, name: "Diana Miller", role: "Backend Developer", github: "dianamiller" },
  {
    id: 5,
    name: "Ethan Brown",
    role: "Frontend Developer",
    email: "ethan@example.com",
    github: "ethanbrown",
  },
  { id: 6, name: "Fiona Taylor", role: "QA Engineer", github: "fionataylor" },
];

Before({ tags: "@member-deletion" }, async () => {
  await fs.writeFile(MEMBERS_PATH, JSON.stringify(ORIGINAL_MEMBERS, null, 2));
});

After({ tags: "@member-deletion" }, async () => {
  await fs.writeFile(MEMBERS_PATH, JSON.stringify(ORIGINAL_MEMBERS, null, 2));
});

When("the user clicks the delete button for {string}", async ({ page }, name: string) => {
  const row = page.locator("tbody tr").filter({ hasText: name });
  const deleteButton = row.locator("td").last().getByRole("button").nth(2);
  await deleteButton.click();
});

Then("a confirmation dialog should appear with the text {string}", async ({ page }, text: string) => {
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText(text)).toBeVisible();
});

Given("the user has clicked the delete button for {string}", async ({ page }, name: string) => {
  const row = page.locator("tbody tr").filter({ hasText: name });
  const deleteButton = row.locator("td").last().getByRole("button").nth(2);
  await deleteButton.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
});

When("the user confirms the deletion", async ({ page }) => {
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});

When("the user cancels the deletion", async ({ page }) => {
  await page.getByRole("button", { name: "Cancel" }).click();
});
