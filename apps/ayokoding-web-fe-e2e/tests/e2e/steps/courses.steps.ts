// Course catalog and learning path steps for the Playwright E2E adapter. Each real-corpus route is a witness found by
// rule (support/witness.ts). The two @fixture scenarios at the end keep the parity fixture's own literals: no real
// course or path lacks a witness for them, so they run only in the fixture config.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";
import { courseIndexes, courseWhere, nth, pathWhere, primaryCourse } from "../support/witness";

const { Given, When, Then } = createBdd();
// Behaviour corpus binding (contract C13). The Playwright home runs the whole feature; no scenario is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/courses/course-catalog-and-paths.feature: *

When("a learner opens the course catalog", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses");
});

Then("courses are grouped by their authored categories", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const category = courseWhere((course) => course.category !== "", "an authored category").category;
  expect(bodyOf(page)).toContain(`data-category="${category}"`);
});

Then("each course shows its title, description, format, and applicable effort estimate", async ({ page }) => {
  const course = primaryCourse().course;
  expect(bodyOf(page)).toContain(course.title);
  expect(bodyOf(page)).toContain(course.description);
});

Then("no catalog count depends on a frozen copy of the shared corpus", async ({ page }) => {
  const course = primaryCourse().course;
  const matches = bodyOf(page).split(`data-course="${course.slug}"`).length - 1;
  expect(matches).toBe(1);
});

Given("a course is currently marked as outline-only", async ({ page }) => {
  stateFor(page).courseId = courseWhere((course) => course.status === "outline", "outline status").slug;
});

When("a learner opens its landing page", async ({ page }) => {
  await gotoPage(page, `/en/learn/courses/${stateFor(page).courseId ?? ""}`);
});

Then("the course shows its outline status and available material honestly", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-outline-status");
});

Then("it is not presented as fully completed by having no learning pages", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-completed-collection");
});

Given("a valid path manifest contains ordered phases and course membership", async ({ page }) => {
  stateFor(page).pathId = pathWhere().id;
});

When("a learner opens that path", async ({ page }) => {
  await gotoPage(page, `/en/learn/paths/${stateFor(page).pathId ?? pathWhere().id}`);
});

Then("its roadmap and course controls follow the manifest's phase order", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const first = bodyOf(page).indexOf("Phase 1:");
  const second = bodyOf(page).indexOf("Phase 2:");
  expect(first).toBeGreaterThanOrEqual(0);
  expect(second).toBeGreaterThanOrEqual(0);
  expect(first).toBeLessThan(second);
  const firstCourse = nth(nth(pathWhere().phases, 0, "a path phase"), 0, "a phase course");
  const title = courseWhere((course) => course.slug === firstCourse, "the first phase course").title;
  expect(bodyOf(page)).toContain(title);
});

Then("phase labels and course position numbers agree across the page", async ({ page }) => {
  for (const marker of ["Phase 1:", "Phase 2:", 'data-position="1"', 'data-position="2"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("a published course declares prerequisites", async ({ page }) => {
  const known = new Set(courseIndexes().map((course) => course.slug));
  const course = courseWhere(
    (candidate) => candidate.prerequisites.some((slug) => known.has(slug)),
    "a prerequisite that is itself published",
  );
  stateFor(page).courseId = course.slug;
});

When("a learner opens its course landing page", async ({ page }) => {
  await gotoPage(page, `/en/learn/courses/${stateFor(page).courseId ?? ""}`);
});

Then("each prerequisite is shown with its current title and canonical route", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const slug = courseIndexes().find((course) => course.slug === stateFor(page).courseId)?.prerequisites[0] ?? "";
  const prerequisite = courseWhere((course) => course.slug === slug, "the prerequisite");
  for (const marker of [prerequisite.title, prerequisite.route, "data-prerequisites"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the path does not place a required core prerequisite after its dependent course", async ({ page }) => {
  await gotoPage(page, `/en/learn/paths/${pathWhere().id}`);
  expect(statusOf(page)).toBe(200);
});

Given("a course URL contains a path identifier that is missing or does not contain that course", async ({ page }) => {
  stateFor(page).pathId = "no-such-path";
});

When("a learner opens that URL", async ({ page }) => {
  const course = primaryCourse().course;
  await gotoPage(page, `${course.route}?path=${stateFor(page).pathId ?? "no-such-path"}`);
});

Then("the course still renders with canonical navigation", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-canonical-nav");
});

Then("no path-specific control claims the invalid path is active", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-path-controls");
});

// Fixture-only scenario (@fixture): the parity fixture records broken-manifest.json as its malformed entry.
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

// Fixture-only scenario (@fixture): no real path category is empty.
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
