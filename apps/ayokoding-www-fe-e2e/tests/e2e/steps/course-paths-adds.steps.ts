import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";

const { Given, When, Then } = createBdd();

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/paths-hub-category-grouping.feature: A path card shows who the path is for, its size, its estimated time, its progress in words, and a View path link
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/paths-hub-category-grouping.feature: A paths hub offers a link to browse the course library
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/paths-hub-category-grouping.feature: Path cards read singular for one core phase
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-fixed-arc-statement.feature: Each skills path card shows the ramp milestone strip
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature: A course that declares no prerequisites shows no prerequisites heading or list
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature: A prerequisite link keeps the path context only when that course belongs to the active path
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: A path landing page tab title reads as the path title
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: An assumed course with no page in this locale shows a readable title, not a raw slug
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: The paths hub and path landing read in Indonesian under /id

// ---------------------------------------------------------------------------
// Step bindings for the scenarios the spec review added to course-paths: the paths hub cards, the
// hub's library link, the singular card counts, the ramp strip, the prerequisite list rules, the
// tab title, the assumed-course titles, and the Indonesian hub and path landing. The unit bindings
// for the same scenarios live in `apps/ayokoding-www/tests/unit/fe-steps/`.
//
// Fixtures (apps/ayokoding-www-fe-e2e/fixtures/manifests): the immediately-effective backend track
// has one core phase of three courses (just-enough-bash, backend-essentials, sql-essentials) and
// assumes just-enough-python. The course pages are real content under apps/ayokoding-www/content.
// ---------------------------------------------------------------------------

const BACKEND_PATH = "careers/immediately-effective/backend-track";
const BACKEND_TITLE = "Backend Track (Immediately-Effective)";
const BACKEND_LANDING = `/en/learn/paths/${BACKEND_PATH}`;
const BACKEND_LANDING_ID = `/id/learn/paths/${BACKEND_PATH}`;
const BACKEND_ESSENTIALS = "/en/learn/courses/backend-essentials";
const PYTHON_COURSE = "/en/learn/courses/just-enough-python";

interface PublishedPhase {
  id: string;
  title: string;
  kind: string;
  courses: string[];
}

interface PublishedManifest {
  pathId: string;
  title: string;
  description: string;
  courseOrder: string[];
  assumes: string[];
  phases?: PublishedPhase[];
}

async function publishedManifests(page: Page): Promise<PublishedManifest[]> {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as { manifests?: PublishedManifest[] };
  return data.manifests ?? [];
}

async function publishedManifest(page: Page, pathId: string): Promise<PublishedManifest> {
  const manifest = (await publishedManifests(page)).find((candidate) => candidate.pathId === pathId);
  if (manifest === undefined) {
    throw new Error(`The running server published no "${pathId}" fixture manifest.`);
  }
  return manifest;
}

function coreCount(manifest: PublishedManifest): number {
  return (manifest.phases ?? []).filter((phase) => phase.kind === "core").length;
}

/** The paths hub or skills landing card whose title link is `title`, as its list item. */
function cardOf(page: Page, title: string) {
  return page.getByRole("link", { name: title, exact: true }).locator("xpath=ancestor::li[1]");
}

// ---------------------------------------------------------------------------
// Paths hub cards and the hub's links (paths-hub-category-grouping.feature)
// ---------------------------------------------------------------------------

Given(
  "the immediately-effective backend track is published with its description and one core phase",
  async ({ page }) => {
    const manifest = await publishedManifest(page, BACKEND_PATH);
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(coreCount(manifest)).toBe(1);
  },
);

Then("the backend track card shows its description as who the path is for", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  await expect(cardOf(page, BACKEND_TITLE).getByText(manifest.description, { exact: true })).toBeVisible();
});

Then("the card states its size in core phases and its estimated time", async ({ page }) => {
  await expect(cardOf(page, BACKEND_TITLE)).toContainText(/1 core phase · 0 optional · About \d+ h/);
});

Then("the card states its progress in words", async ({ page }) => {
  await expect(cardOf(page, BACKEND_TITLE)).toContainText(/\d+ of 3 core courses done/);
});

Then('the card ends with a "View path" link to that path', async ({ page }) => {
  const link = cardOf(page, BACKEND_TITLE).getByRole("link", { name: /View path/ });
  await expect(link).toHaveAttribute("href", BACKEND_LANDING);
});

Then(
  'the hub ends with a link that reads "Browse the full course library" and opens the course library',
  async ({ page }) => {
    const link = page.getByRole("link", { name: /Browse the full course library/ });
    await expect(link).toHaveAttribute("href", "/en/browse");
  },
);

Given("the immediately-effective backend track is published with one core phase", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  expect(coreCount(manifest)).toBe(1);
});

Then('the backend track card reads "1 core phase" and never "1 core phases"', async ({ page }) => {
  const card = cardOf(page, BACKEND_TITLE);
  await expect(card).toContainText("1 core phase ·");
  await expect(card).not.toContainText("1 core phases");
});

// ---------------------------------------------------------------------------
// Skills landing ramp strip (skills-fixed-arc-statement.feature)
// ---------------------------------------------------------------------------

Then(
  'each skills path card shows the ramp milestones "Dangerous", "Comfortable", and "Confident" in that order',
  async ({ page }) => {
    const cards = page.getByRole("navigation", { name: "Skills paths" }).locator(":scope > ul > li");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index).locator("ol > li")).toHaveText(["Dangerous", "Comfortable", "Confident"]);
    }
  },
);

// ---------------------------------------------------------------------------
// Prerequisite list rules (prerequisite-display.feature)
// ---------------------------------------------------------------------------

Given("the just-enough-python course page declares no prerequisites in its canonical metadata", async ({ page }) => {
  await page.goto(PYTHON_COURSE);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "Just Enough Python" })).toBeVisible();
});

When("a reader opens the just-enough-python course page with or without a path context", async ({ page }) => {
  await page.goto(PYTHON_COURSE);
  await page.waitForLoadState("networkidle");
  await page.goto(`${PYTHON_COURSE}?path=${BACKEND_PATH}`);
  await page.waitForLoadState("networkidle");
});

Then('the page shows no "Prerequisites" heading and no prerequisites list', async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Prerequisites" })).toHaveCount(0);
  await page.goto(PYTHON_COURSE);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("navigation", { name: "Prerequisites" })).toHaveCount(0);
});

Given(
  "a course in an active path declares two prerequisites, one that is in that path and one that is not",
  async ({ page }) => {
    const manifest = await publishedManifest(page, BACKEND_PATH);
    expect(manifest.courseOrder).toContain("sql-essentials");
    expect(manifest.assumes).toContain("just-enough-python");
    expect(manifest.courseOrder).not.toContain("just-enough-python");
  },
);

When("a reader opens the course page in that path context", async ({ page }) => {
  await page.goto(`${BACKEND_ESSENTIALS}?path=${BACKEND_PATH}`);
  await page.waitForLoadState("networkidle");
});

Then("the link to the prerequisite in the path keeps the path context", async ({ page }) => {
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites.getByRole("link", { name: "SQL Essentials", exact: true })).toHaveAttribute(
    "href",
    `/en/learn/courses/sql-essentials?path=${BACKEND_PATH}`,
  );
});

Then(
  "the link to the prerequisite outside the path opens its canonical course page without a path context",
  async ({ page }) => {
    const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
    await expect(prerequisites.getByRole("link", { name: "Just Enough Python", exact: true })).toHaveAttribute(
      "href",
      PYTHON_COURSE,
    );
  },
);

// ---------------------------------------------------------------------------
// Path landing tab title, assumed-course titles, Indonesian (skills-path-landing-body.feature)
// ---------------------------------------------------------------------------

When("a reader opens the immediately-effective backend track landing page", async ({ page }) => {
  await page.goto(BACKEND_LANDING);
  await page.waitForLoadState("networkidle");
});

Then('the browser tab title reads "Backend Track \\(Immediately-Effective\\)"', async ({ page }) => {
  await expect(page).toHaveTitle(/^Backend Track \(Immediately-Effective\)/);
});

Given(
  'the immediately-effective backend track assumes the course "just-enough-python", which has no page in Indonesian',
  async ({ page }) => {
    const manifest = await publishedManifest(page, BACKEND_PATH);
    expect(manifest.assumes).toContain("just-enough-python");
  },
);

When("a reader opens the backend track landing page in Indonesian", async ({ page }) => {
  await page.goto(BACKEND_LANDING_ID);
  await page.waitForLoadState("networkidle");
});

Then('the "Before you start" note links to a course titled "Just Enough Python"', async ({ page }) => {
  await expect(page.getByRole("link", { name: "Just Enough Python", exact: true })).toBeVisible();
});

Then('no link in that note shows the raw slug "just-enough-python"', async ({ page }) => {
  await expect(page.getByRole("link", { name: "just-enough-python", exact: true })).toHaveCount(0);
});

When("a reader opens the paths hub at \\/id\\/learn\\/paths in Indonesian", async ({ page }) => {
  await page.goto("/id/learn/paths");
  await page.waitForLoadState("networkidle");
});

Then('the hub\'s course library link reads "Jelajahi seluruh pustaka kursus"', async ({ page }) => {
  await expect(page.getByRole("link", { name: /Jelajahi seluruh pustaka kursus/ })).toBeVisible();
});

Then('the "Before you start" heading reads "Sebelum memulai"', async ({ page }) => {
  await expect(page.getByRole("heading", { level: 2, name: "Sebelum memulai" })).toBeVisible();
});
