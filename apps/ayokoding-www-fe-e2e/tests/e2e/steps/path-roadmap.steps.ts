import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";
import { completeCourseThroughUi } from "./support/complete-course";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 4 — the path roadmap
// (course-paths/path-roadmap.feature, S19–S26). The unit bindings for the same scenarios live in
// `apps/ayokoding-www/tests/unit/fe-steps/path-roadmap.steps.tsx`.
//
// Fixtures (tech-docs/006): the generalist-track fixture carries both a core phase with an outcome
// and an extension phase whose course is an outline course (S19, S20, S21, S23, S24); the
// backend-track fixture carries three core courses with no extension (S22, S25); and
// `skills/conventional-accounting` is the marked pending-restructure fixture (S26).
//
// S19, S20, and S21 declare no path-staging Given of their own, so their step texts are shared:
// "a reader opens a path page" (S19, S20) opens the generalist track — the fixture that satisfies
// both — and "the reader opens a path page" (S21, and progress-store's S5) the backend track. Every
// other step here stages its own path in the scenario's Given.
// ---------------------------------------------------------------------------

const GENERALIST_PATH = "careers/fundamentally-strong/generalist-track";
const GENERALIST_TITLE = "Generalist Track (Fundamentally-Strong)";
const GENERALIST_LANDING = `/en/learn/paths/${GENERALIST_PATH}`;

const BACKEND_PATH = "careers/immediately-effective/backend-track";
const BACKEND_TITLE = "Backend Track (Immediately-Effective)";

const ACCOUNTING_PATH = "skills/conventional-accounting";
const ACCOUNTING_TITLE = "Conventional Accounting Skills Path";
const ACCOUNTING_LANDING = `/en/learn/paths/${ACCOUNTING_PATH}`;

const BASH_ID = "just-enough-bash";
const BACKEND_ID = "backend-essentials";
const CAPSTONE_ID = "capstone-secure-service";

/** The course landing header (`courseHeaderLabel`) whose primary action opens a course's first page. */
const COURSE_HEADER = 'header[aria-label="Course summary"]';

// ---------------------------------------------------------------------------
// Fixture truth, read from the running server — the same technique (and shapes) as
// `course-paths.steps.ts`'s own private helpers, which cannot be imported here.
// ---------------------------------------------------------------------------

interface PublishedPhase {
  id: string;
  title: string;
  kind: string;
  outcome?: { can: string; cannotYet?: string };
  courses: string[];
}

interface PublishedManifest {
  pathId: string;
  title: string;
  courseOrder: string[];
  phases?: PublishedPhase[];
  restructurePendingIn?: string;
}

async function publishedManifests(page: Page): Promise<PublishedManifest[]> {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as { manifests?: PublishedManifest[] };
  return data.manifests ?? [];
}

/** The published manifest of one fixture path: every assertion's truth comes from this, not a guess. */
async function publishedManifest(page: Page, pathId: string): Promise<PublishedManifest> {
  const manifest = (await publishedManifests(page)).find((candidate) => candidate.pathId === pathId);
  if (manifest === undefined) {
    throw new Error(`The running server published no "${pathId}" fixture manifest.`);
  }
  return manifest;
}

/** The path page's syllabus landmark — plan 02's name, kept through the roadmap rewrite. */
function syllabus(page: Page, pathTitle: string) {
  return page.getByRole("navigation", { name: `${pathTitle} syllabus` });
}

function corePhases(manifest: PublishedManifest): PublishedPhase[] {
  return (manifest.phases ?? []).filter((phase) => phase.kind === "core");
}

function extensionPhases(manifest: PublishedManifest): PublishedPhase[] {
  return (manifest.phases ?? []).filter((phase) => phase.kind === "extension");
}

/** Every core course of a path, in path order — what the headline counts. */
function coreCourseIds(manifest: PublishedManifest): string[] {
  return corePhases(manifest).flatMap((phase) => phase.courses);
}

function corePhaseOf(manifest: PublishedManifest): PublishedPhase {
  const [first] = corePhases(manifest);
  if (first === undefined) {
    throw new Error(`"${manifest.pathId}" declares no core phase`);
  }
  return first;
}

function extensionPhaseOf(manifest: PublishedManifest): PublishedPhase {
  const [first] = extensionPhases(manifest);
  if (first === undefined) {
    throw new Error(`"${manifest.pathId}" declares no extension phase`);
  }
  return first;
}

/**
 * The path a shared step opens, staged by the scenario's own Given. Each shared step names its own
 * fallback for the scenarios that declare no path-staging Given: "a reader opens a path page"
 * (S19, S20) falls back to the generalist track — the one fixture that shows both a core phase
 * with an outcome and an outline extension course — and "the reader opens a path page" (S21, and
 * progress-store's S5) to the backend track.
 */
let stagedPath: string | null = null;

async function openStagedPath(page: Page, fallback: string): Promise<void> {
  const pathId = stagedPath ?? fallback;
  stagedPath = null;
  await page.goto(`/en/learn/paths/${pathId}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Open every closed optional-extensions section (U5): an extension phase renders as a `<details>`
 * closed by default, so its course cards only become visible once its `<summary>` is clicked.
 * Mirrors `course-paths.steps.ts`'s own helper, which is private to that module.
 */
async function openExtensionSections(page: Page): Promise<void> {
  const closed = page.locator("details:not([open]) > summary");

  for (let remaining = await closed.count(); remaining > 0 && remaining <= 20; remaining -= 1) {
    await closed.first().click();
  }
}

/** The title of the course row at 1-based `position` on a path page, read off the page itself. */
async function rowTitle(page: Page, pathTitle: string, position: number): Promise<string> {
  const row = syllabus(page, pathTitle)
    .locator("ol > li")
    .nth(position - 1);
  return (await row.getByRole("link").first().innerText()).trim();
}

/**
 * A reader who has opened one course of a path and marked its first learning page complete: the
 * course landing's primary action opens the course's first sequence page, whose own completion
 * control then stands checked without leaving that page.
 */
async function markFirstLearningPageComplete(page: Page, courseId: string, pathId: string): Promise<void> {
  const courseRoot = `/en/learn/courses/${courseId}`;

  await page.goto(`${courseRoot}?path=${pathId}`);
  await page.waitForLoadState("networkidle");
  await page.locator(COURSE_HEADER).locator(`a[href^="${courseRoot}/"], button`).first().click();
  await page.waitForURL((url) => url.pathname.startsWith(`${courseRoot}/`));

  const toggle = page.getByRole("navigation", { name: "Page navigation" }).getByRole("button");
  await expect(toggle).toBeEnabled();
  // A click can land before the hydrated store has attached its handler (seen in Firefox), so the
  // click-and-verify pair is retried as a unit until the pressed state flips.
  await expect(async () => {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

// ---------------------------------------------------------------------------
// S19 — each core phase is a milestone with its outcome and progress.
// ---------------------------------------------------------------------------

When("a reader opens a path page", async ({ page }) => {
  await openStagedPath(page, GENERALIST_PATH);
});

Then(
  'each core phase shows its number, title, and "After this phase you can" outcome when the path defines one',
  async ({ page }) => {
    const manifest = await publishedManifest(page, GENERALIST_PATH);
    const phase = corePhaseOf(manifest);
    const outcome = phase.outcome?.can;
    expect(outcome).toBeTruthy();

    const nav = syllabus(page, GENERALIST_TITLE);
    await expect(
      nav.getByRole("heading", { level: 3, name: new RegExp(`^Phase 1 · ${phase.title}$`, "u") }),
    ).toBeVisible();
    await expect(nav.getByText(`After this phase you can ${outcome as string}`)).toBeVisible();
  },
);

Then('each core phase shows "x of y done" for its courses', async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  const phase = corePhaseOf(manifest);

  await expect(page.locator(`section[id="phase-${phase.id}"]`)).toContainText(`0 of ${phase.courses.length} done`);
});

// ---------------------------------------------------------------------------
// S20 — course cards show order, time, format, and status in words.
// ---------------------------------------------------------------------------

Then("each course card shows its position number, title, estimated time, and format", async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  expect(coreCourseIds(manifest)).toEqual(["computer-science-foundations", "software-engineering-practices"]);

  const rows = syllabus(page, GENERALIST_TITLE).locator("ol > li");
  // The two core courses, plus the extension's course: positions continue across the phase boundary.
  await expect(rows).toHaveCount(3);

  // Both courses are annotated-concept, 5 hours, per their own frontmatter.
  const expected = [
    { position: "1", title: "Computer Science Foundations", format: "Concept walkthrough", hours: "About 5 h" },
    { position: "2", title: "Software Engineering Practices", format: "Concept walkthrough", hours: "About 5 h" },
  ];
  for (const [index, course] of expected.entries()) {
    const row = rows.nth(index);
    await expect(row).toHaveText(new RegExp(`^${course.position}\\s*${course.title}`, "u"));
    // The position number sits outside the link, so the link's accessible name stays the title.
    await expect(row.getByRole("link", { name: course.title, exact: true })).toBeVisible();
    await expect(row).toContainText(course.format);
    await expect(row).toContainText(course.hours);
  }
});

Then('each course card shows "Done", "In progress", or "Not started" as text', async ({ page }) => {
  const rows = syllabus(page, GENERALIST_TITLE).locator("ol > li");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    // Every card states its status in words; colour is never the only signal.
    await expect(rows.nth(index)).toHaveText(/(Done|In progress|Not started)/);
  }
  // A browser context that has marked nothing sees the not-started words.
  await expect(rows.nth(0)).toContainText("Not started");
});

Then('an outline course card shows an "Outline" badge', async ({ page }) => {
  await openExtensionSections(page);

  const row = syllabus(page, GENERALIST_TITLE).locator("ol > li", { hasText: "Capstone · Secure Service" });
  await expect(row.getByText("Outline", { exact: true })).toBeVisible();
  // An outline course declares no estimate, so the badge stands where the hours text would be.
  await expect(row).not.toContainText("About");
});

// ---------------------------------------------------------------------------
// S21 — a new reader sees one Start button, and progress-store's S5 — the unreadable record shows
// not-started cards. Neither scenario has a path-staging Given of its own (S21's Given, "a reader
// has no saved progress", is defined once in `progress-store.steps.ts`, shared with S1 and S18: a
// fresh browser context is exactly that reader), so both ride this step, which opens the
// backend-track fixture.
// ---------------------------------------------------------------------------

When("the reader opens a path page", async ({ page }) => {
  await openStagedPath(page, BACKEND_PATH);
});

Then('exactly one primary button reads "Start:" followed by the first course\'s title', async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  const firstCourseId = coreCourseIds(manifest)[0] as string;
  expect(firstCourseId).toBe(BASH_ID);

  // The primary lives in the progress card before the syllabus nav (a CTA is not navigation),
  // so it is scoped to the page — while the row title it names is still read off the syllabus.
  const buttons = page.getByRole("link", { name: /^(Start|Continue):/ });
  // One primary control only, and it names the path's own first course — read off the page.
  await expect(buttons).toHaveCount(1);
  await expect(buttons).toHaveText(`Start: ${await rowTitle(page, BACKEND_TITLE, 1)}`);
  await expect(buttons).toHaveAttribute("href", new RegExp(`^/en/learn/courses/${firstCourseId}`));
});

Then("it links to that course's landing page in path context", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  const firstCourseId = coreCourseIds(manifest)[0] as string;

  await expect(page.getByRole("link", { name: /^Start:/ })).toHaveAttribute(
    "href",
    `/en/learn/courses/${firstCourseId}?path=${BACKEND_PATH}`,
  );
});

/**
 * progress-store's S5, "Then every course card shows ...": the roadmap `<nav aria-label="… syllabus">`
 * is matched by its name suffix, because this step runs on the path the shared step above opened.
 */
Then("every course card shows {string}", async ({ page }, status: string) => {
  const rows = page.locator("nav[aria-label$='syllabus'] ol > li");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(rows.nth(index)).toContainText(status);
  }
});

// ---------------------------------------------------------------------------
// S22 — a returning reader sees Continue with the next course.
// ---------------------------------------------------------------------------

Given("a reader completed some learning pages of the path's second course", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  expect(manifest.courseOrder.slice(0, 2)).toEqual([BASH_ID, BACKEND_ID]);

  // A returning reader: the first course behind them, the second one started but unfinished.
  await completeCourseThroughUi(page, BASH_ID, BACKEND_PATH);
  await markFirstLearningPageComplete(page, BACKEND_ID, BACKEND_PATH);
  stagedPath = BACKEND_PATH;
});

When("the reader opens the path page", async ({ page }) => {
  // Every user of this step stages its own path in the scenario's Given; the fallback only keeps
  // the step total.
  await openStagedPath(page, BACKEND_PATH);
});

Then('the primary button reads "Continue:" followed by the second course\'s title', async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  expect(manifest.courseOrder[1]).toBe(BACKEND_ID);

  const buttons = page.getByRole("link", { name: /^(Start|Continue):/ });
  await expect(buttons).toHaveCount(1);
  await expect(buttons).toHaveText(`Continue: ${await rowTitle(page, BACKEND_TITLE, 2)}`);
});

Then("it links to the first learning page of that course the reader has not completed", async ({ page }) => {
  const button = page.getByRole("link", { name: /^Continue:/ });
  const href = await button.getAttribute("href");

  // A page of the second course in path context — never the course landing page and never a page
  // the reader has already finished.
  expect(href).toMatch(new RegExp(`^/en/learn/courses/${BACKEND_ID}/[^?]+\\?path=${BACKEND_PATH}$`, "u"));

  // Following it resumes the sequence one page on from the page just completed, which is this
  // course's first unfinished page: the reader completed its first learning page, so this is the
  // second.
  await button.click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("navigation", { name: "Lesson location" })).toContainText(/Page 2 of \d+/);
});

// ---------------------------------------------------------------------------
// S23 — optional extensions are separate and closed by default.
// ---------------------------------------------------------------------------

When("a reader opens a path that has extension phases", async ({ page }) => {
  // The generalist-track fixture is the one fixture that declares an extension phase.
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  expect(extensionPhaseOf(manifest).courses).toEqual([CAPSTONE_ID]);

  await page.goto(GENERALIST_LANDING);
  await page.waitForLoadState("networkidle");
});

Then('an "Optional extensions" heading follows the last core phase', async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  const lastCore = corePhases(manifest).at(-1) as PublishedPhase;

  const headings = await syllabus(page, GENERALIST_TITLE).getByRole("heading").allTextContents();
  const coreIndex = headings.findIndex((text) => text.includes(lastCore.title));
  const extensionsIndex = headings.findIndex((text) => text.includes("Optional extensions"));
  expect(coreIndex).toBeGreaterThanOrEqual(0);
  expect(extensionsIndex).toBeGreaterThan(coreIndex);
});

Then('each extension phase is a closed section that shows its title and "x of y done"', async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  const phase = extensionPhaseOf(manifest);

  const details = syllabus(page, GENERALIST_TITLE).locator("details");
  await expect(details).toHaveCount(1);
  await expect(details).toHaveJSProperty("open", false);

  const summary = details.locator("summary");
  await expect(summary).toContainText(phase.title);
  await expect(summary).toContainText(phase.courses.length === 1 ? "1 course" : `${phase.courses.length} courses`);
  await expect(summary).toContainText(`0 of ${phase.courses.length} done`);
});

Then("opening an extension phase shows its course cards", async ({ page }) => {
  const details = syllabus(page, GENERALIST_TITLE).locator("details");
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", true);

  const rows = details.locator("ol > li");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Capstone · Secure Service");
  await expect(rows.first().getByRole("link", { name: "Capstone · Secure Service" })).toHaveAttribute(
    "href",
    `/en/learn/courses/${CAPSTONE_ID}?path=${GENERALIST_PATH}`,
  );
});

// ---------------------------------------------------------------------------
// S24 — the path headline counts core courses only.
// ---------------------------------------------------------------------------

Given("a reader completed every learning page of one extension course and nothing else", async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  expect(extensionPhaseOf(manifest).courses).toEqual([CAPSTONE_ID]);

  await completeCourseThroughUi(page, CAPSTONE_ID, GENERALIST_PATH);
  stagedPath = GENERALIST_PATH;
});

Then('the headline reads "0 of N core courses done"', async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  const coreTotal = coreCourseIds(manifest).length;

  await expect(page.getByText(`0 of ${coreTotal} core courses done`, { exact: true })).toBeVisible();
});

Then('that extension phase shows "1 of M done"', async ({ page }) => {
  const manifest = await publishedManifest(page, GENERALIST_PATH);
  const phase = extensionPhaseOf(manifest);

  const summary = syllabus(page, GENERALIST_TITLE).locator("details summary");
  await expect(summary).toContainText("Done");
  await expect(summary).toContainText(`1 of ${phase.courses.length} done`);
});

// ---------------------------------------------------------------------------
// S25 — finishing the core path shows completion.
// ---------------------------------------------------------------------------

Given("a reader completed every core course of a path", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  expect(coreCourseIds(manifest)).toEqual([BASH_ID, BACKEND_ID, "sql-essentials"]);

  for (const courseId of coreCourseIds(manifest)) {
    await completeCourseThroughUi(page, courseId, BACKEND_PATH);
  }
  stagedPath = BACKEND_PATH;
});

Then("the headline says the core path is complete", async ({ page }) => {
  const manifest = await publishedManifest(page, BACKEND_PATH);
  const coreTotal = coreCourseIds(manifest).length;
  await expect(page.getByText("Core path complete. The optional extensions are below.", { exact: true })).toBeVisible();
  await expect(page.getByText(`${coreTotal} of ${coreTotal} core courses done`, { exact: true })).toBeVisible();
});

Then('no "Start" or "Continue" button is shown', async ({ page }) => {
  await expect(page.getByRole("link", { name: /^(Start|Continue):/ })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// S26 — a skills path waiting for its restructure shows one flat list with progress.
// ---------------------------------------------------------------------------

Given("a skills path is marked as pending restructure", async ({ page }) => {
  const manifest = await publishedManifest(page, ACCOUNTING_PATH);

  // The exact marked shape: the allowlisted plan-06 marker over one flat all-courses core phase.
  expect(manifest.restructurePendingIn).toBe("plan-06");
  expect((manifest.phases ?? []).map((phase) => ({ id: phase.id, kind: phase.kind }))).toEqual([
    { id: "all-courses", kind: "core" },
  ]);
  expect(manifest.phases?.[0]?.outcome).toBeUndefined();
});

When("a reader opens that path page", async ({ page }) => {
  await page.goto(ACCOUNTING_LANDING);
  await page.waitForLoadState("networkidle");
});

Then("its courses appear in one list in today's order with status in words", async ({ page }) => {
  const manifest = await publishedManifest(page, ACCOUNTING_PATH);
  const rows = syllabus(page, ACCOUNTING_TITLE).locator("ol > li");

  await expect(rows).toHaveCount(manifest.courseOrder.length);
  for (const [index, courseId] of manifest.courseOrder.entries()) {
    const row = rows.nth(index);
    // Plan 01's position numbers in the manifest's own order, every card a link into path context.
    await expect(row).toHaveText(new RegExp(`^${index + 1}(?!\\d)`, "u"));
    await expect(row.getByRole("link")).toHaveAttribute(
      "href",
      `/en/learn/courses/${courseId}?path=${ACCOUNTING_PATH}`,
    );
    // Nothing has been marked in this context, and the status is a word, not a colour.
    await expect(row).toContainText("Not started");
  }
});

Then('no phase heading, outcome line, or "Optional extensions" heading appears', async ({ page }) => {
  const nav = syllabus(page, ACCOUNTING_TITLE);

  await expect(nav.locator("h3")).toHaveCount(0);
  await expect(nav.locator("details")).toHaveCount(0);
  await expect(nav).not.toContainText("After this phase you can");
  await expect(nav).not.toContainText("Optional extensions");
});
