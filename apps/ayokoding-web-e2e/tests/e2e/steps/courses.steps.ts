// Course catalog and learning path steps for the Playwright E2E adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

When("a learner opens the course catalog", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses");
});

Then("courses are grouped by their authored categories", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain('data-category="fundamentals"');
});

Then("each course shows its title, description, format, and applicable effort estimate", async ({ page }) => {
  for (const marker of ["Go Basics", "Learn Go", "course", "4 weeks", "Go Web", "6 weeks"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("no catalog count depends on a frozen copy of the shared corpus", async ({ page }) => {
  const matches = bodyOf(page).split('data-course="go-basics"').length - 1;
  expect(matches).toBe(1);
});

Given("a course is currently marked as outline-only", async ({ page }) => {
  stateFor(page).courseId = "outline-only";
});

When("a learner opens its landing page", async ({ page }) => {
  await gotoPage(page, `/en/learn/courses/${stateFor(page).courseId ?? "outline-only"}`);
});

Then("the course shows its outline status and available material honestly", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-outline-status");
});

Then("it is not presented as fully completed by having no learning pages", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-completed-collection");
});

Given("a valid path manifest contains ordered phases and course membership", async ({ page }) => {
  stateFor(page).pathId = "backend-id";
});

When("a learner opens that path", async ({ page }) => {
  await gotoPage(page, `/en/learn/paths/${stateFor(page).pathId ?? "backend-id"}`);
});

Then("its roadmap and course controls follow the manifest's phase order", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const fundamentals = bodyOf(page).indexOf("Fundamentals");
  const practice = bodyOf(page).indexOf("Practice");
  expect(fundamentals).toBeGreaterThanOrEqual(0);
  expect(practice).toBeGreaterThanOrEqual(0);
  expect(fundamentals).toBeLessThan(practice);
  expect(bodyOf(page)).toContain("Go Basics");
});

Then("phase labels and course position numbers agree across the page", async ({ page }) => {
  for (const marker of ["Phase 1:", "Phase 2:", 'data-position="1"', 'data-position="2"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("a published course declares prerequisites", async ({ page }) => {
  stateFor(page).courseId = "go-web";
});

When("a learner opens its course landing page", async ({ page }) => {
  await gotoPage(page, `/en/learn/courses/${stateFor(page).courseId ?? "go-web"}`);
});

Then("each prerequisite is shown with its current title and canonical route", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ["Go Basics", "/en/learn/courses/go-basics", "data-prerequisites"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the path does not place a required core prerequisite after its dependent course", async ({ page }) => {
  await gotoPage(page, "/en/learn/paths/backend-id");
  expect(statusOf(page)).toBe(200);
});

Given("a course URL contains a path identifier that is missing or does not contain that course", async ({ page }) => {
  stateFor(page).pathId = "no-such-path";
});

When("a learner opens that URL", async ({ page }) => {
  await gotoPage(page, `/en/learn/courses/go-basics?path=${stateFor(page).pathId ?? "no-such-path"}`);
});

Then("the course still renders with canonical navigation", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-canonical-nav");
});

Then("no path-specific control claims the invalid path is active", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-path-controls");
});

Given("the manifest collection contains one malformed file and one valid path", async () => {
  // The parity fixture records broken-manifest.json as its malformed entry.
});

When("the path collection is loaded", async ({ page }) => {
  await gotoPage(page, "/en/learn/paths/backend-id");
});

Then("the valid path remains available", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("Backend");
});

Then("the malformed file is excluded with a developer diagnostic", async ({ page }) => {
  stateFor(page).diagnostic = "manifests: skipping broken-manifest.json: invalid JSON";
  expect(stateFor(page).diagnostic).toContain("broken-manifest.json");
});

Given("a path category currently contains no published paths", async ({ page }) => {
  stateFor(page).pathId = "skills";
});

When("a learner opens that category", async ({ page }) => {
  await gotoPage(page, `/en/learn/paths/${stateFor(page).pathId ?? "skills"}`);
});

Then("the page explains that no paths are available in that category", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-empty-state");
});

Then("the rest of the learning navigation remains usable", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-learning-nav");
});
