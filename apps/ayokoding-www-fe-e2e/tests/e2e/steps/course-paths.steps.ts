import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// course-paths plan (ayokoding-learning-path-03-navigation-ui), Phase 3 — e2e step definitions.
//
// Every scenario below runs against the fixture manifest set at
// `apps/ayokoding-www-fe-e2e/fixtures/manifests/` (see that directory's own README.md) — the
// running server's `AYOKODING_WEB_MANIFESTS_DIR` is pointed there by `playwright.config.ts`
// (local) and `infra/dev/ayokoding-www/docker-compose.yml` (CI), so every "Given a fixture ..."
// each fixture Given below queries the live server and proves the expected manifest is loaded.
// ---------------------------------------------------------------------------

const PHONE_VIEWPORT = { width: 375, height: 812 };

interface PublishedManifest {
  pathId: string;
  arc: string;
  title: string;
  courseOrder: string[];
  phases?: FixturePhase[];
  assumes?: string[];
}

interface FixturePhase {
  id: string;
  title: string;
  kind: string;
  outcome?: { can: string; cannotYet?: string };
  courses: string[];
}

async function loadPublishedManifests(page: Page): Promise<PublishedManifest[]> {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as {
    manifests?: PublishedManifest[];
  };
  return data.manifests ?? [];
}

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-02-path-model, Phase 4 — shared locators for the
// phase-grouped path assertions below (one definition per locator, reused by every
// Phase 4 scenario instead of repeating selectors).
// ---------------------------------------------------------------------------

const GENERALIST_TRACK_PATH = "careers/fundamentally-strong/generalist-track";
const GENERALIST_LANDING_URL = `/en/learn/paths/${GENERALIST_TRACK_PATH}`;
const GENERALIST_SYLLABUS_NAME = "Generalist Track (Fundamentally-Strong) syllabus";
const GENERALIST_RAIL_NAME = "Generalist Track (Fundamentally-Strong) course list";

function syllabusNav(page: Page, name: string | RegExp) {
  return page.getByRole("navigation", { name });
}

function generalistSyllabus(page: Page) {
  return syllabusNav(page, GENERALIST_SYLLABUS_NAME);
}

function generalistRail(page: Page) {
  return syllabusNav(page, GENERALIST_RAIL_NAME);
}

/** The phase courses of a syllabus/rail nav — `ol > li` only, so the assumes `<ul>` never leaks in. */
function phaseRows(nav: ReturnType<Page["getByRole"]>) {
  return nav.locator("ol > li");
}

/**
 * Opens every closed optional-extensions section (plan 04 Phase 4, U5): extension phases now render
 * as `<details>` closed by default, so their course cards only become visible once their
 * `<summary>` is clicked.
 */
async function openOptionalExtensions(page: Page) {
  const closed = page.locator("details:not([open]) > summary");

  for (let remaining = await closed.count(); remaining > 0 && remaining <= 20; remaining -= 1) {
    await closed.first().click();
  }
}

interface GeneralistTrackFixture {
  manifest: PublishedManifest;
  core: FixturePhase;
  extension: FixturePhase;
  assumes: string[];
}

async function loadGeneralistTrack(page: Page): Promise<GeneralistTrackFixture> {
  const manifests = await loadPublishedManifests(page);
  const manifest = manifests.find((candidate) => candidate.pathId === GENERALIST_TRACK_PATH);
  const phases = manifest?.phases ?? [];
  expect(phases.map((phase) => phase.kind)).toEqual(["core", "extension"]);
  const [core, extension] = phases;
  const assumes = manifest?.assumes ?? [];
  if (!manifest || !core || !extension) {
    throw new Error("generalist-track fixture manifest is missing its phases");
  }
  return { manifest, core, extension, assumes };
}

// The landing-page When shared by three scenarios ("a reader opens that path's landing page"
// appears in path-position-numbers S1 plus path-phases S2/S3 and path-assumes S1): each scenario's
// Given stages which path the shared step opens, defaulting to the backend-track fixture.
let pendingPathLanding: string | null = null;

async function gotoPendingPathLanding(page: Page): Promise<void> {
  const pathId = pendingPathLanding ?? "careers/immediately-effective/backend-track";
  pendingPathLanding = null;
  await page.goto(`/en/learn/paths/${pathId}`);
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// Cycle 3.1 — path landing renders its courses in manifest order, path-context query param
// (breadcrumb.feature)
// ---------------------------------------------------------------------------

Given("a fixture path manifest is loaded by the manifest repository", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.some((manifest) => manifest.pathId === "careers/interview-ready/backend-track")).toBe(true);
});

When("a reader opens that fixture path's landing page under \\/en\\/learn\\/paths\\/", async ({ page }) => {
  await page.goto("/en/learn/paths/careers/interview-ready/backend-track");
  await page.waitForLoadState("networkidle");
});

Then("the courses appear in the fixture manifest's phase order", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: /backend track \(interview-ready\) syllabus/i });
  await expect(nav.getByRole("heading", { name: /Fixture core/ })).toBeVisible();
  const links = nav.getByRole("link");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toContainText("Just Enough Python");
  await expect(links.nth(1)).toContainText("Data Structures");
});

Then("every course link carries the path context query parameter", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: /backend track \(interview-ready\) syllabus/i });
  const links = nav.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    expect(href).toContain("?path=careers/interview-ready/backend-track");
  }
});

// ---------------------------------------------------------------------------
// Cycle 3.1b-i — careers category landing arc chooser (category-landing-arc-chooser.feature)
// ---------------------------------------------------------------------------

Given("a fixture careers manifest set with three arcs is loaded", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.filter(({ pathId }) => pathId.startsWith("careers/")).map(({ pathId }) => pathId)).toEqual([
    "careers/fundamentally-strong/generalist-track",
    "careers/immediately-effective/backend-track",
    "careers/immediately-effective/frontend-track",
    "careers/interview-ready/backend-track",
  ]);
});

When("a reader opens the careers category landing at \\/en\\/learn\\/paths\\/careers\\/", async ({ page }) => {
  await page.goto("/en/learn/paths/careers");
  await page.waitForLoadState("networkidle");
});

// Plan ayokoding-learn-revamp-04 Phase 7 (U3): the arc chooser's `ArcCard`s became one arc-headed
// section of shared `LearnPathCard`s — the arc heading itself now links to the arc page.
Then("the page renders one section per arc, each arc heading linking to the arc page", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Careers arcs" });
  const arcs = [
    { arc: "fundamentally-strong", title: "Fundamentally Strong" },
    { arc: "immediately-effective", title: "Immediately-Effective" },
    { arc: "interview-ready", title: "Interview-Ready" },
  ];

  await expect(nav.getByRole("heading", { level: 2 })).toHaveCount(arcs.length);
  for (const { arc, title } of arcs) {
    const heading = nav.getByRole("heading", { level: 2, name: title, exact: true });
    await expect(heading).toBeVisible();
    await expect(heading.getByRole("link", { name: title, exact: true })).toHaveAttribute(
      "href",
      `/en/learn/paths/careers/${arc}`,
    );
  }
});

Then("the immediately-effective section shows exactly two path cards", async ({ page }) => {
  const section = page.locator('section[aria-labelledby="careers-arc-immediately-effective"]');
  await expect(section).toHaveCount(1);

  const cards = section.locator(":scope > ul > li");
  await expect(cards).toHaveCount(2);
  await expect(
    section.getByRole("link", { name: "Backend Track (Immediately-Effective)", exact: true }),
  ).toHaveAttribute("href", "/en/learn/paths/careers/immediately-effective/backend-track");
  await expect(
    section.getByRole("link", { name: "Frontend Track (Immediately-Effective)", exact: true }),
  ).toHaveAttribute("href", "/en/learn/paths/careers/immediately-effective/frontend-track");
  await expect(section.getByRole("link", { name: /View path/ })).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Cycle 3.1b-ii — skills category landing fixed-arc statement (skills-fixed-arc-statement.feature)
// ---------------------------------------------------------------------------

Given("a fixture skills manifest set is loaded", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  // Three since plan ayokoding-learn-revamp-04, Phase 4 added the marked
  // `skills/conventional-accounting` fixture the roadmap scenarios need (the marked shape is
  // closed to the four real allowlisted skills paths, so it can only be exercised through a
  // fixture). Recorded in that plan's `evidence/phase-4-roadmap.md`.
  expect(manifests.filter((manifest) => manifest.pathId?.startsWith("skills/"))).toHaveLength(3);
});

When("a reader opens the skills category landing at \\/en\\/learn\\/paths\\/skills\\/", async ({ page }) => {
  await page.goto("/en/learn/paths/skills");
  await page.waitForLoadState("networkidle");
});

Then("the page renders the ramp promise once as a statement, not a question", async ({ page }) => {
  const promise = page.getByText("Get up and running fast on the ramp", { exact: false });
  await expect(promise).toHaveCount(1);
  const text = await promise.textContent();
  expect(text?.trim().endsWith("?")).toBe(false);
});

Then("no arc-selection control is present anywhere on the page", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Careers arcs" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Explore the .* arc/ })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Cycle 3.1c-i — arc landing, two-role state (arc-landing-two-role.feature)
// ---------------------------------------------------------------------------

Given("the fixture immediately-effective arc manifest lists two roles", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.filter((manifest) => manifest.pathId?.startsWith("careers/immediately-effective/"))).toHaveLength(2);
});

When(
  "a reader opens the arc landing at \\/en\\/learn\\/paths\\/careers\\/immediately-effective\\/",
  async ({ page }) => {
    await page.goto("/en/learn/paths/careers/immediately-effective");
    await page.waitForLoadState("networkidle");
  },
);

Then("both role cards render side by side with their own course counts", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "immediately-effective paths" });
  await expect(nav.locator(":scope > ul > li")).toHaveCount(2);

  // Plan 04 Phase 7: each role renders the shared learning path card, whose own progress line
  // states that role's own core-course count — the fixture roles differ deliberately (backend
  // three core courses, frontend two), so one shared or placeholder count could not satisfy both.
  const backend = nav
    .getByRole("link", { name: "Backend Track (Immediately-Effective)", exact: true })
    .locator("xpath=ancestor::li[1]");
  const frontend = nav
    .getByRole("link", { name: "Frontend Track (Immediately-Effective)", exact: true })
    .locator("xpath=ancestor::li[1]");
  await expect(backend).toContainText(/\d+ of 3 core courses done/);
  await expect(frontend).toContainText(/\d+ of 2 core courses done/);
});

Then("neither card is a placeholder or an empty grid cell", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "immediately-effective paths" });
  await expect(nav.getByRole("link", { name: "Frontend Track (Immediately-Effective)", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Backend Track (Immediately-Effective)", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: /View path/ })).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Cycle 3.1c-ii — arc landing, single-role state (arc-landing-one-role.feature)
// ---------------------------------------------------------------------------

Given("a fixture arc manifest lists exactly one role", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.filter((manifest) => manifest.pathId.startsWith("careers/interview-ready/"))).toEqual([
    expect.objectContaining({
      pathId: "careers/interview-ready/backend-track",
      arc: "interview-ready",
      title: "Backend Track (Interview-Ready)",
      courseOrder: ["just-enough-python", "data-structures-and-algorithms-essentials"],
    }),
  ]);
});

When("a reader opens that arc's landing page", async ({ page }) => {
  await page.goto("/en/learn/paths/careers/interview-ready");
  await page.waitForLoadState("networkidle");
});

Then(
  "the single role card renders with a preview that names the first phase and lists its courses",
  async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "interview-ready paths" });
    // Plan 04 Phase 7: the role card is the shared learning path card, so its link is the path
    // title; the single-role `SyllabusPreview` still sits beside it inside the same list item.
    const card = nav.getByRole("link", { name: "Backend Track (Interview-Ready)", exact: true });
    await expect(card).toHaveAttribute("href", "/en/learn/paths/careers/interview-ready/backend-track");
    await expect(card.locator("xpath=ancestor::li[1]").getByText("Starts with Phase 1 · Fixture core:")).toBeVisible();
    const previewItems = card.locator("xpath=ancestor::li[1]").locator("ol > li");
    await expect(previewItems).toHaveCount(2);
    // Numbered preview (plan ayokoding-learn-revamp-01 §4.2): each inline item renders its path
    // position before the title, separated by " · " from the previous item.
    await expect(previewItems.nth(0)).toContainText("1 Just Enough Python");
    await expect(previewItems.nth(1)).toContainText("2 Data Structures & Algorithms Essentials");
  },
);

Then("the layout does not reserve or render a visibly empty second card", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "interview-ready paths" });
  const items = nav.locator("> ul > li");
  await expect(items).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// Cycle 3.1d — skills path landing body content (skills-path-landing-body.feature)
// ---------------------------------------------------------------------------

Given(
  "two fixture skills paths whose landing bodies declare different runway-justification paragraphs for their differing first boundaries",
  async ({ page }) => {
    const manifests = await loadPublishedManifests(page);
    expect(manifests.map((manifest) => manifest.pathId)).toEqual(
      expect.arrayContaining(["skills/e2e-fixture-alpha", "skills/e2e-fixture-beta"]),
    );
  },
);

When("a reader opens either skills path's landing page", async ({ page }) => {
  await page.goto("/en/learn/paths/skills/e2e-fixture-alpha");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "E2E Fixture Alpha Skills Path" })).toBeVisible();
});

Then(
  "that path's landing renders its own authored runway-justification paragraph between the title and the syllabus",
  async ({ page }) => {
    await page.goto("/en/learn/paths/skills/e2e-fixture-alpha");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("never opened a terminal", { exact: false })).toBeVisible();

    await page.goto("/en/learn/paths/skills/e2e-fixture-beta");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("never touched a database", { exact: false })).toBeVisible();
  },
);

Then("the other path's justification paragraph never appears on this page", async ({ page }) => {
  await page.goto("/en/learn/paths/skills/e2e-fixture-alpha");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("never touched a database", { exact: false })).toHaveCount(0);

  await page.goto("/en/learn/paths/skills/e2e-fixture-beta");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("never opened a terminal", { exact: false })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Cycle 3.2 — landing hero (landing-hero.feature)
// ---------------------------------------------------------------------------

Given("a first-time visitor opens the site landing page at \\/en", async ({ page }) => {
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
});

When("the hero section renders", async ({ page }) => {
  await expect(page.locator("section").first()).toBeVisible();
});

Then("the hero shows a goal-labeled path card for each published path", async ({ page }) => {
  const hero = page.locator("section").first();
  await expect(hero.getByText("Choose your path")).toBeVisible();
  const cards = hero.getByRole("link", { name: /^Start the / });
  const expected = (await loadPublishedManifests(page))
    .filter(({ pathId }) => pathId.startsWith("careers/"))
    .map(({ pathId, title, courseOrder }) => ({
      name: `Start the ${title} path — ${courseOrder.length} courses`,
      href: `/en/learn/paths/${pathId}`,
    }));
  await expect(cards).toHaveCount(expected.length);
  for (const path of expected) {
    await expect(hero.getByRole("link", { name: path.name, exact: true })).toHaveAttribute("href", path.href);
  }
});

Then('a "Compare all paths" link to \\/en\\/learn\\/paths is visible below the cards', async ({ page }) => {
  const link = page.getByRole("link", { name: "Compare all paths →" });
  await expect(link).toBeVisible();
  expect(await link.getAttribute("href")).toBe("/en/learn/paths");
});

// ---------------------------------------------------------------------------
// Cycle 3.4 — aggregate feature binder (canonical-fallback / invalid-path-fallback /
// omitted-course / path-order-nav / paths-hub-category-grouping)
// ---------------------------------------------------------------------------

// canonical-fallback.feature, scenario 1 — production manifests place
// backend-essentials in every career path, and it declares prerequisites
// (sql-essentials, just-enough-python), so the prerequisite list is exercised too.
Given(
  "a reader opens a course URL \\/en\\/learn\\/courses\\/<course-id> with no path context query parameter",
  async ({ page }) => {
    await page.goto("/en/learn/courses/backend-essentials");
  },
);

When("the course page renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the course body renders in full with the content-tree breadcrumb and its prerequisite list", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  const article = page.getByRole("article");
  await expect(article.getByRole("heading", { level: 1, name: "Backend Essentials", exact: true })).toBeVisible();
  await expect(article.getByRole("link", { name: "Learning", exact: true })).toHaveAttribute(
    "href",
    "/en/learn/courses/backend-essentials/learning",
  );
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites.getByRole("link", { name: "SQL Essentials", exact: true })).toHaveAttribute(
    "href",
    "/en/learn/courses/sql-essentials",
  );
  await expect(prerequisites.getByRole("link", { name: "Just Enough Python", exact: true })).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-python",
  );
});

Then('a "this course is part of" affordance lists every path that includes the course', async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "This course is part of" });
  const paths = (await loadPublishedManifests(page)).filter(({ courseOrder }) =>
    courseOrder.includes("backend-essentials"),
  );

  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(paths.length);

  for (const path of paths) {
    await expect(nav.getByRole("link", { name: path.title })).toHaveAttribute(
      "href",
      `/en/learn/paths/${path.pathId}?path=${path.pathId}`,
    );
  }
});

// canonical-fallback.feature, scenario 2 — generic sidebar unchanged.
// "When the page renders" is shared with `cost-of-living-calculator.steps.ts` (identical
// `page.waitForLoadState("networkidle")` semantics) — not redefined here.
Given("a reader opens a canonical course URL with no path context query parameter", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python");
});

Then("the left sidebar shows the generic content tree exactly as it does elsewhere in the site", async ({ page }) => {
  const sidebarLinks = (targetPage: typeof page) =>
    targetPage
      .getByRole("navigation", { name: "Sidebar navigation" })
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) => ({ text: link.textContent?.trim() ?? "", href: link.getAttribute("href") })),
      );
  const currentLinks = await sidebarLinks(page);
  expect(currentLinks.length).toBeGreaterThan(0);

  const comparisonPage = await page.context().newPage();
  try {
    await comparisonPage.goto("/en/learn/courses/just-enough-python?path=not-a-published-path");
    await comparisonPage.waitForLoadState("networkidle");
    const comparisonLinks = await sidebarLinks(comparisonPage);
    expect(currentLinks).toEqual(comparisonLinks);
  } finally {
    await comparisonPage.close();
  }
});

Then("no path rail, path readout, or path breadcrumb segment appears", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: /course list$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Open path course list/ })).toHaveCount(0);
});

// invalid-path-fallback.feature.
Given("a reader opens a course URL with a path context that names no known path", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python?path=careers/does-not-exist/no-such-role");
});

Then("the course renders the canonical standalone view", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /course list$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Open path course list/ })).toHaveCount(0);
});

Then("no error is shown", async ({ page }) => {
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

// omitted-course.feature — sql-essentials is not in the interview-ready/backend-track manifest.
Given("a course is not listed in a given path's manifest", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  const manifest = manifests.find((candidate) => candidate.pathId === "careers/interview-ready/backend-track");
  expect(manifest?.courseOrder).not.toContain("sql-essentials");
});

When("a reader opens that course with that path's context", async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials?path=careers/interview-ready/backend-track");
  await page.waitForLoadState("networkidle");
});

Then("neither the path rail nor the path banner is shown for that path", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: /course list$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Open path course list/ })).toHaveCount(0);
});

// path-order-nav.feature, scenario 2 — desktop rail.
Given("a reader is on a course with an active path context", async ({ page }) => {
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
});

When(/^the reader reads the prev\/next navigation$/, async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Page navigation" })).toBeVisible();
});

Then("prev and next are the neighboring courses in that path's manifest", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  await expect(navigation.getByRole("link", { name: /Just Enough Bash/i })).toBeVisible();
  await expect(navigation.getByRole("link", { name: /SQL Essentials/i })).toBeVisible();
});

Then("both links preserve the path context query parameter", async ({ page }) => {
  // Generic across scenarios: every prev/next link keeps the current page's ?path=, whichever
  // fixture path is active (the backend-track order scenario and the Phase 4 core→extension
  // crossing scenario share this step text).
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  const links = navigation.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  const activePath = new URL(page.url()).searchParams.get("path");
  expect(activePath).not.toBeNull();
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toHaveAttribute("href", new RegExp(`\\?path=${activePath}$`));
  }
});

Given("a reader opens a course in path context on a desktop-width viewport", async ({ page }) => {
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
});

Then(
  "the left rail lists that path's courses grouped under phase headings in manifest order with the current course marked",
  async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
    await expect(nav.getByText("Phase 1 · Fixture core")).toBeVisible();
    const items = nav.locator("ol > li");
    await expect(items).toHaveCount(3);
    const expected = [
      {
        name: "Just Enough Bash",
        href: "/en/learn/courses/just-enough-bash?path=careers/immediately-effective/backend-track",
        current: null,
      },
      {
        name: "Backend Essentials",
        href: "/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track",
        current: "page",
      },
      {
        name: "SQL Essentials",
        href: "/en/learn/courses/sql-essentials?path=careers/immediately-effective/backend-track",
        current: null,
      },
    ];
    for (const [index, course] of expected.entries()) {
      const link = items.nth(index).getByRole("link", { name: course.name, exact: true });
      await expect(link).toHaveAttribute("href", course.href);
      if (course.current) await expect(link).toHaveAttribute("aria-current", course.current);
      else await expect(link).not.toHaveAttribute("aria-current", "page");
    }
  },
);

Then("the current course is distinguished by a marker and weight, not by colour alone", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  // Playwright's `getByRole` does not support a `current` filter option — filter by the actual
  // `aria-current="page"` DOM attribute instead.
  const current = nav.locator('a[aria-current="page"]');
  await expect(current).toContainText("▸");
  await expect(current).toHaveClass(/\bbg-accent\b/);
  await expect(current).toHaveClass(/\bfont-semibold\b/);
  await expect(nav.getByText("Course 2 of 3", { exact: true })).toBeVisible();
});

Then("the rail offers a link back to the full path and to the whole course library", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  await expect(nav.getByRole("link", { name: "View full path" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Browse all courses" })).toBeVisible();
});

// path-order-nav.feature, scenario 3 — phone drawer.
Given("a reader opens a course in path context on a phone-width viewport", async ({ page }) => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
});

When('they activate the path readout\'s "open path course list" control', async ({ page }) => {
  await page.getByRole("button", { name: /Open path course list/ }).click();
});

Then("the existing left navigation drawer opens showing that path's ordered courses", async ({ page }) => {
  const drawer = page.locator("#mobile-nav-drawer");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" }),
  ).toBeVisible();
});

Then("focus moves into the drawer and returns to the control when the drawer is dismissed", async ({ page }) => {
  const drawer = page.locator("#mobile-nav-drawer");
  const isFocusInsideDrawer = await drawer.evaluate((el) => el.contains(document.activeElement));
  expect(isFocusInsideDrawer).toBe(true);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  const trigger = page.getByRole("button", { name: /Open path course list/ });
  await expect(trigger).toBeFocused();
});

// path-order-nav.feature, scenario 4 (UWT-008 fix, phase-8 rule-15 retest) — picking a course
// inside the pocket drawer must close it, like the primary-navigation links always did.
Given("a reader has the pocket drawer open from a course's path readout", async ({ page }) => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Open path course list/ }).click();
  await expect(page.locator("#mobile-nav-drawer")).toBeVisible();
});

When("they pick another course's row in the drawer", async ({ page }) => {
  const drawer = page.locator("#mobile-nav-drawer");
  // The rail rows: the current course's row comes first in navigation order, so pick a
  // neighbouring row (a different course) rather than re-opening the same page.
  const row = drawer.getByRole("navigation").getByRole("link").nth(1);
  await row.click();
});

Then("the drawer closes and the drawer-open state is cleared", async ({ page }) => {
  await expect(page.locator("#mobile-nav-drawer")).toBeHidden();
});

Then("the primary navigation links still close the drawer as before", async ({ page }) => {
  // The untouched general-navigation branch: the header hamburger opens the drawer in menu mode
  // (no path context), whose primary links close on pick — behaviour that predates this plan.
  await page.setViewportSize(PHONE_VIEWPORT);
  await page.goto("/en/learn/courses/backend-essentials");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const drawer = page.locator("#mobile-nav-drawer");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link").first().click();
  await expect(drawer).toBeHidden();
});

// paths-hub-category-grouping.feature.
Given("a fixture manifest set covers both a careers-shaped and a skills-shaped fixture", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.some((manifest) => manifest.pathId?.startsWith("careers/"))).toBe(true);
  expect(manifests.some((manifest) => manifest.pathId?.startsWith("skills/"))).toBe(true);
});

Given(
  /^a re-homed course previously lived under the legacy fundamentally-strong\/software-engineer content path$/,
  async ({ page }) => {
    const response = await page.request.get(
      "/en/learn/fundamentally-strong/software-engineer/just-enough-python?path=careers/interview-ready/backend-track",
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(308);
  },
);

When("a reader requests the legacy URL", async ({ page }) => {
  await page.goto(
    "/en/learn/fundamentally-strong/software-engineer/just-enough-python?path=careers/interview-ready/backend-track",
  );
  await page.waitForLoadState("networkidle");
});

Then(/^the app redirects to the course's canonical \/en\/learn\/courses\/<course-id> URL$/, async ({ page }) => {
  expect(new URL(page.url()).pathname).toBe("/en/learn/courses/just-enough-python");
});

Then("the redirect preserves any path context query parameter", async ({ page }) => {
  expect(new URL(page.url()).searchParams.get("path")).toBe("careers/interview-ready/backend-track");
});

Then("it shows Home, Learn, the path title, and the course title", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Learn" })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Backend Track (Immediately-Effective)" })).toBeVisible();
  await expect(breadcrumb.getByText("Backend Essentials", { exact: true })).toHaveAttribute("aria-current", "page");
});

Then(
  /^the path crumb links to the path landing page \/en\/learn\/paths\/<path-id> without a self-referential path context query$/,
  async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", {
        name: "Backend Track (Immediately-Effective)",
      }),
    ).toHaveAttribute("href", "/en/learn/paths/careers/immediately-effective/backend-track");
  },
);

Given("a course declares prerequisites in its canonical metadata", async ({ page }) => {
  const response = await page.request.get("/en/learn/courses/backend-essentials");
  await expect(response).toBeOK();
});

When("a reader opens the course page with or without a path context", async ({ page }) => {
  await page.goto("/en/learn/courses/backend-essentials");
  await page.waitForLoadState("networkidle");
});

Then("the page lists each prerequisite course with a link to its canonical URL", async ({ page }) => {
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites.getByRole("link", { name: "SQL Essentials" })).toHaveAttribute(
    "href",
    "/en/learn/courses/sql-essentials",
  );
  await expect(prerequisites.getByRole("link", { name: "Just Enough Python" })).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-python",
  );
});

Then("the prerequisite list renders even in the canonical no-path view", async ({ page }) => {
  expect(new URL(page.url()).searchParams.has("path")).toBe(false);
  await expect(page.getByRole("navigation", { name: "Prerequisites" })).toBeVisible();
});

When("a reader opens the paths hub at \\/en\\/learn\\/paths", async ({ page }) => {
  await page.goto("/en/learn/paths");
  await page.waitForLoadState("networkidle");
});

Then("the hub renders a Careers section grouped by arc and a separate Skills section", async ({ page }) => {
  const careersHeading = page.getByRole("heading", { level: 2, name: "Careers" });
  const skillsHeading = page.getByRole("heading", { level: 2, name: "Skills" });
  await expect(careersHeading).toBeVisible();
  await expect(skillsHeading).toBeVisible();
  // `exact: true` disambiguates the arc-group's own `<h3>` (its full accessible name is exactly
  // the arc's humanized/authored title — UWT-001 fix, phase-5 rule-15 retest — never the raw arc
  // slug) from a `PathCard`'s `<h3 data-slot="card-title">` whose title text merely contains the
  // arc name as a substring (e.g. "Backend Track (Interview-Ready)").
  await expect(page.getByRole("heading", { level: 3, name: "Interview-Ready", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Immediately-Effective", exact: true })).toBeVisible();
});

Then("no path card from either category is rendered outside its category's section", async ({ page }) => {
  // `CategorySection` (path-card.tsx) sets `aria-labelledby="{id}-heading"` on its own `<section>`
  // — scope directly to that, rather than `section:has(h2)`, which would also match the hub's
  // outer wrapping `<section>` (itself a `has`-match ancestor of both category sections).
  const careersSection = page.locator("section[aria-labelledby='careers-heading']");
  const skillsSection = page.locator("section[aria-labelledby='skills-heading']");

  await expect(careersSection.getByText("E2E Fixture Alpha")).toHaveCount(0);
  await expect(careersSection.getByText("E2E Fixture Beta")).toHaveCount(0);
  await expect(skillsSection.getByText("Backend Track")).toHaveCount(0);
  await expect(skillsSection.getByText("Frontend Track")).toHaveCount(0);
  await expect(skillsSection.getByText("Generalist Track")).toHaveCount(0);
});

// path-position-numbers.feature, scenario 1 — no catalogue number in course titles.
Given("a reader opens a course in path context", async ({ page }) => {
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
});

Then(
  "the page heading, breadcrumb, previous and next links, and prerequisite links show course titles without a leading number",
  async ({ page }) => {
    const numbered = /^\d+\s*·\s/;
    const article = page.locator("article").first();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    const pageNav = page.getByRole("navigation", { name: "Page navigation" });
    const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
    const texts = [
      (await article.getByRole("heading", { level: 1 }).innerText()).trim(),
      (await breadcrumb.getByText("Backend Essentials").innerText()).trim(),
      (await pageNav.getByRole("link", { name: /Just Enough Bash/i }).innerText()).trim(),
      (await pageNav.getByRole("link", { name: /SQL Essentials/i }).innerText()).trim(),
      (await prerequisites.getByRole("link").first().innerText()).trim(),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(numbered);
    }
  },
);

Then("the only course order number on the page is the course's position in the active path", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  await expect(nav.getByText("Course 2 of 3", { exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
// path-position-numbers.feature, scenarios 2–4 (plan ayokoding-learn-revamp-01, Phase 4 RED) —
// S1 syllabus numbers, S2 rail numbers, S3 arc-card preview numbers. S2's Given ("a reader opens
// a course in path context on a desktop-width viewport") and S3's Given/When are already bound
// above; only the numbering steps are new here, plus the updated preview expectations in the
// Cycle 3.1c-ii section.
// ---------------------------------------------------------------------------

// S1 — syllabus rows on the backend-track fixture path's landing page.
Given("a learning path lists its courses in manifest order", async ({ page }) => {
  const manifest = (await loadPublishedManifests(page)).find(
    (candidate) => candidate.pathId === "careers/immediately-effective/backend-track",
  );
  expect(manifest?.courseOrder).toEqual(["just-enough-bash", "backend-essentials", "sql-essentials"]);
  pendingPathLanding = "careers/immediately-effective/backend-track";
});

When("a reader opens that path's landing page", async ({ page }) => {
  // Shared by the S1 numbering scenario, the Phase 4 outcome/extensions scenarios, and the
  // assumes scenario — each Given stages its own path above.
  await gotoPendingPathLanding(page);
});

Then("each syllabus row shows its position number starting at 1 before the course title", async ({ page }) => {
  const syllabus = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
  const rows = syllabus.locator("ol > li");
  await expect(rows).toHaveCount(3);
  const expected = [
    { position: "1", title: "Just Enough Bash" },
    { position: "2", title: "Backend Essentials" },
    { position: "3", title: "SQL Essentials" },
  ];
  for (const [index, { position, title }] of expected.entries()) {
    await expect(rows.nth(index)).toHaveText(new RegExp(`^${position}\\s*${title}$`, "u"));
    // The number sits outside the link (tech-docs §4.2), so the link's accessible name stays
    // exactly the title (WCAG 2.5.3 Label in Name).
    await expect(rows.nth(index).getByRole("link", { name: title, exact: true })).toBeVisible();
  }
});

Then("the position numbers follow the manifest order with no gaps", async ({ page }) => {
  const syllabus = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
  const rows = syllabus.locator("ol > li");
  const count = await rows.count();
  expect(count).toBe(3);
  for (let index = 0; index < count; index += 1) {
    const leading = ((await rows.nth(index).textContent()) ?? "").match(/^\d+/u)?.[0] ?? "";
    expect(leading).toBe(String(index + 1));
  }
});

// S2 — rail rows on backend-essentials in path context. The already-bound Given navigates to
// /en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track and the
// already-bound "the page renders" waits for network idle.
Then("each rail row shows its position number before the course title", async ({ page }) => {
  const rail = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  const rows = rail.getByRole("listitem");
  await expect(rows).toHaveCount(3);
  const expected = [
    { position: "1", title: "Just Enough Bash" },
    { position: "2", title: "Backend Essentials" },
    { position: "3", title: "SQL Essentials" },
  ];
  for (const [index, { position, title }] of expected.entries()) {
    // The current row's ▸ marker sits between the number and the title inside the link.
    await expect(rows.nth(index)).toHaveText(new RegExp(`^${position}\\s*▸?\\s*${title}$`, "u"));
    // The link keeps its aria-label={title}; the row number never leaks into the name
    // (tech-docs §4.2, Decision D4).
    await expect(rows.nth(index).getByRole("link", { name: title, exact: true })).toBeVisible();
  }
});

Then("the current course's row shows its own position number with the current-course marker", async ({ page }) => {
  const rail = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  const currentRow = rail.locator('li:has(a[aria-current="page"])');
  await expect(currentRow).toHaveCount(1);
  const currentLink = currentRow.getByRole("link", { name: "Backend Essentials", exact: true });
  await expect(currentLink).toContainText("▸");
  await expect(currentLink).toHaveClass(/\bbg-accent\b/);
  // backend-essentials is position 2 of 3, and its number renders before the ▸ marker.
  await expect(currentRow).toHaveText(/^2\s*▸/u);
});

// S3 — the interview-ready arc card's inline first-phase preview (Given/When bound in the
// Cycle 3.1c-ii section above).
Then('the role card\'s "Starts with" preview numbers its courses 1, 2, and so on in path order', async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "interview-ready paths" });
  // Plan 04 Phase 7: the role card is the shared learning path card — its link is the path title.
  const card = nav.getByRole("link", { name: "Backend Track (Interview-Ready)", exact: true });
  const previewItems = card.locator("xpath=ancestor::li[1]").locator("ol > li");
  await expect(previewItems).toHaveCount(2);
  const texts = await previewItems.allTextContents();
  // The inline separator " · " precedes every number except the first, so the second item's
  // textContent starts with it; trailing/leading whitespace is trimmed here only.
  expect(texts[0]?.trim()).toBe("1 Just Enough Python");
  expect(texts[1]?.trim()).toBe("· 2 Data Structures & Algorithms Essentials");
});

Then("no preview item shows a second number inside the course title", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "interview-ready paths" });
  // Plan 04 Phase 7: the role card is the shared learning path card — its link is the path title.
  const card = nav.getByRole("link", { name: "Backend Track (Interview-Ready)", exact: true });
  const previewItems = card.locator("xpath=ancestor::li[1]").locator("ol > li");
  await expect(previewItems).toHaveCount(2);
  // Strip the rendered position number and its separator; only the bare title must remain — a
  // second number inside the title (the old DWT-002 collision) would survive this strip.
  const bareTitles = (await previewItems.allTextContents()).map((text) =>
    text
      .trim()
      .replace(/^·\s*/u, "")
      .replace(/^\d+\s*/u, ""),
  );
  expect(bareTitles).toEqual(["Just Enough Python", "Data Structures & Algorithms Essentials"]);
});

// ---------------------------------------------------------------------------
// path-order-nav.feature, scenario 4 (plan ayokoding-learn-revamp-01, Phase 5 RED) — S5: the
// desktop rail auto-scrolls its own overflow-y: auto container so the current course's row is
// fully visible, and the page itself never moves (tech-docs.md §4.3, Decisions D5/D11).
// sql-essentials is the last of the backend-track fixture's three courses, so at the 1280×H
// viewport below its row starts below the visible part of the rail. The When step ("the page
// renders") is shared with cost-of-living-calculator.steps.ts (identical networkidle semantics) —
// not redefined here, same as the canonical-fallback scenario above.
// ---------------------------------------------------------------------------
// The rail viewport was height-200 in Phase 5 (the DWT-003 pre-fix geometry scrolled the whole
// sidebar). Phase 8's DWT-003 fix pins the "Course k of N" readout above a bounded, floating row
// region (ol flex-1 min-h-0) that also hosts the rail's own footer below; at 200px the row region
// had 0px left (readout + footer minimums exceed it), so the helper met a zero-height container.
// This fixture path has THREE courses, and the DWT-003-fixed geometry must keep row 3 (of 3)
// hidden while leaving the row region nonzero (≥1 row) so the helper has a real scroll container:
// region = viewport − 64 (header) − 32 (host padding) − 12 (readout) − 24 (nav gaps) − ~101
// (footer) ≈ viewport − 233; 320px ⇒ ~87px of row region — rows 1–2 visible, row 3 hidden below,
// the ol overflows (3 rows ≈ 137px > 87px) and the helper centres row 3 inside it.
const RAIL_SCROLL_VIEWPORT = { width: 1280, height: 320 };

Given("a reader opens a course whose rail row starts below the visible part of the sidebar", async ({ page }) => {
  await page.setViewportSize(RAIL_SCROLL_VIEWPORT);
  await page.goto("/en/learn/courses/sql-essentials?path=careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
});

Then("the sidebar scrolls so the current course's row is fully visible", async ({ page }) => {
  const rail = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  const currentLink = rail.locator('a[aria-current="page"]');
  await expect(currentLink).toHaveCount(1);

  const linkBox = await currentLink.boundingBox();
  expect(linkBox).not.toBeNull();

  // The nearest ancestor whose overflow-y is auto/scroll AND whose content actually overflows —
  // the same walk the auto-scroll helper performs (tech-docs.md §4.3's findScrollContainer).
  const scrollContainer = await currentLink
    .evaluateHandle((link) => {
      let node = link.parentElement as HTMLElement | null;
      while (node && node !== document.body) {
        const overflowY = window.getComputedStyle(node).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement as HTMLElement | null;
      }
      return null;
    })
    .then((handle) => handle.asElement());
  expect(scrollContainer).not.toBeNull();

  const containerBox = await scrollContainer!.boundingBox();
  expect(containerBox).not.toBeNull();

  // "Fully visible" = the row's box lies inside the scroll container's visible box. Vertical
  // containment is the behaviour under test — before the fix the row starts below the container's
  // bottom edge; horizontal containment holds trivially because rail rows truncate.
  expect(linkBox!.y).toBeGreaterThanOrEqual(containerBox!.y);
  expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(containerBox!.y + containerBox!.height);
  expect(linkBox!.x).toBeGreaterThanOrEqual(containerBox!.x);
  expect(linkBox!.x + linkBox!.width).toBeLessThanOrEqual(containerBox!.x + containerBox!.width);
});

// playwright-bdd has no `And` keyword — the feature's And step binds via `Then` (its text is what
// matches), the same convention as every other And step in this file.
Then("the page itself stays scrolled to the top", async ({ page }) => {
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-02-path-model, Phase 4 — path-phases (6 browser scenarios),
// path-assumes (1), and the outline badge, all against the generalist-track fixture: a core
// phase ("Fixture core": computer-science-foundations, software-engineering-practices, outcome
// "complete this fixture path"), an extension phase ("Fixture extension": capstone-secure-service,
// status outline), and 5 assumed courses. The 7th path-phases scenario (marked skills flat list)
// is e2e-exempt — bound only in ayokoding-www unit steps.
// ---------------------------------------------------------------------------

Given("a fixture path manifest declares a core phase and an extension phase", async ({ page }) => {
  await loadGeneralistTrack(page);
});

When("a reader opens that path's landing page under \\/en\\/learn\\/paths\\/", async ({ page }) => {
  await page.goto(GENERALIST_LANDING_URL);
  await page.waitForLoadState("networkidle");
});

Then("each phase renders as a heading with its title", async ({ page }) => {
  const nav = generalistSyllabus(page);
  await expect(nav.getByRole("heading", { name: /Fixture core/ })).toBeVisible();
  await expect(nav.getByRole("heading", { name: /Fixture extension/ })).toBeVisible();
});

Then("the core phase's courses appear before the extension phase's courses", async ({ page }) => {
  await openOptionalExtensions(page);
  const rows = phaseRows(generalistSyllabus(page));
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Computer Science Foundations");
  await expect(rows.nth(1)).toContainText("Software Engineering Practices");
  await expect(rows.nth(2)).toContainText("Capstone · Secure Service");
});

Then("course position numbers continue across the phase boundary", async ({ page }) => {
  await openOptionalExtensions(page);
  const rows = phaseRows(generalistSyllabus(page));
  await expect(rows).toHaveCount(3);
  const expected = [
    { position: "1", title: "Computer Science Foundations" },
    { position: "2", title: "Software Engineering Practices" },
    { position: "3", title: "Capstone · Secure Service" },
  ];
  for (const [index, { position, title }] of expected.entries()) {
    // The outline row also renders its badge text after the title, so the match anchors at the
    // leading position number, not at the row end.
    await expect(rows.nth(index)).toHaveText(new RegExp(`^${position}\\s*${title}`, "u"));
    // The number sits outside the link, so the link's accessible name stays exactly the title.
    await expect(rows.nth(index).getByRole("link", { name: title, exact: true })).toBeVisible();
  }
});

Given("a fixture core phase declares an outcome", async ({ page }) => {
  const { core } = await loadGeneralistTrack(page);
  expect(core.outcome?.can).toBe("complete this fixture path");
  pendingPathLanding = GENERALIST_TRACK_PATH;
});

Then('the phase shows "After this phase you can" followed by the outcome', async ({ page }) => {
  await expect(generalistSyllabus(page).getByText("After this phase you can complete this fixture path")).toBeVisible();
});

Then(
  'when the outcome declares what the reader cannot yet do, the phase also shows "You cannot yet"',
  async ({ page }) => {
    // The fixture outcome declares no `cannotYet`, so the conditional step proves the negative;
    // the positive rendering is covered by the unit steps with a cannotYet-bearing fixture.
    const { core } = await loadGeneralistTrack(page);
    expect(core.outcome?.cannotYet).toBeUndefined();
    await expect(generalistSyllabus(page).getByText("You cannot yet", { exact: false })).toHaveCount(0);
  },
);

Given("a fixture path manifest declares an extension phase", async ({ page }) => {
  const { extension } = await loadGeneralistTrack(page);
  expect(extension.kind).toBe("extension");
  pendingPathLanding = GENERALIST_TRACK_PATH;
});

Then('an "Optional extensions" heading appears after the last core phase', async ({ page }) => {
  const nav = generalistSyllabus(page);
  const headings = await nav.getByRole("heading").allTextContents();
  const coreIndex = headings.findIndex((text) => text.includes("Fixture core"));
  const extensionsIndex = headings.findIndex((text) => text.includes("Optional extensions"));
  expect(coreIndex).toBeGreaterThanOrEqual(0);
  expect(extensionsIndex).toBeGreaterThan(coreIndex);
});

Then("every extension phase is listed under that heading", async ({ page }) => {
  const nav = generalistSyllabus(page);
  const headings = await nav.getByRole("heading").allTextContents();
  const extensionsIndex = headings.findIndex((text) => text.includes("Optional extensions"));
  const extensionIndex = headings.findIndex((text) => text.includes("Fixture extension"));
  expect(extensionsIndex).toBeGreaterThanOrEqual(0);
  expect(extensionIndex).toBeGreaterThan(extensionsIndex);
});

Then("the left rail shows each phase title followed by that phase's courses", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  await expect(nav.getByText("Phase 1 · Fixture core")).toBeVisible();
  const items = nav.locator("ol > li");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("Just Enough Bash");
  await expect(items.nth(1)).toContainText("Backend Essentials");
  await expect(items.nth(2)).toContainText("SQL Essentials");
});

Then("the current course is still marked by a marker and weight, not by colour alone", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  const current = nav.locator('a[aria-current="page"]');
  await expect(current).toContainText("▸");
  await expect(current).toHaveClass(/\bfont-semibold\b/);
  await expect(nav.getByText("Course 2 of 3", { exact: true })).toBeVisible();
});

Given("a reader is on the last course of a fixture path's last core phase", async ({ page }) => {
  const { core } = await loadGeneralistTrack(page);
  expect(core.courses.at(-1)).toBe("software-engineering-practices");
  await page.goto(`/en/learn/courses/software-engineering-practices?path=${GENERALIST_TRACK_PATH}`);
  await page.waitForLoadState("networkidle");
});

Then("next is the first course of the first extension phase", async ({ page }) => {
  const { extension } = await loadGeneralistTrack(page);
  expect(extension.courses[0]).toBe("capstone-secure-service");
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  await expect(navigation.getByRole("link", { name: /Capstone.*Secure Service/i })).toHaveAttribute(
    "href",
    `/en/learn/courses/capstone-secure-service?path=${GENERALIST_TRACK_PATH}`,
  );
});

Then("the link preserves the path context query parameter", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  await expect(navigation.getByRole("link", { name: /Capstone.*Secure Service/i })).toHaveAttribute(
    "href",
    new RegExp(`\\?path=${GENERALIST_TRACK_PATH}$`),
  );
});

let routeDataPayload: { manifests?: PublishedManifest[]; outlineCourseIds?: string[] } | null = null;

Given("the fixture manifest set is loaded by the running server", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.length).toBeGreaterThan(0);
});

When('a client requests coursePaths.getRouteData for locale "en"', async ({ page }) => {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  routeDataPayload = extractTrpcData(await response.json()) as {
    manifests?: PublishedManifest[];
    outlineCourseIds?: string[];
  };
});

Then("each manifest in the response carries its phases with id, title, kind, outcome, and courses", async () => {
  const manifests = routeDataPayload?.manifests ?? [];
  expect(manifests.length).toBeGreaterThan(0);
  for (const manifest of manifests) {
    expect(manifest.phases?.length).toBeGreaterThan(0);
    for (const phase of manifest.phases ?? []) {
      expect(typeof phase.id).toBe("string");
      expect(typeof phase.title).toBe("string");
      expect(["core", "extension"]).toContain(phase.kind);
      expect(Array.isArray(phase.courses)).toBe(true);
    }
  }
  // The same payload carries the outline set the badges render from.
  expect(routeDataPayload?.outlineCourseIds).toContain("capstone-secure-service");
});

Then("each manifest also carries a courseOrder equal to its phases' courses in order", async () => {
  const manifests = routeDataPayload?.manifests ?? [];
  expect(manifests.length).toBeGreaterThan(0);
  for (const manifest of manifests) {
    const flattened = (manifest.phases ?? []).flatMap((phase) => phase.courses);
    expect(manifest.courseOrder).toEqual(flattened);
  }
});

Given("a fixture path manifest declares assumed courses", async ({ page }) => {
  const { assumes } = await loadGeneralistTrack(page);
  expect(assumes).toEqual([
    "just-enough-python",
    "data-structures-and-algorithms-essentials",
    "just-enough-bash",
    "software-testing",
    "backend-essentials",
  ]);
  pendingPathLanding = GENERALIST_TRACK_PATH;
});

Then('a "Before you start" note appears before the first phase', async ({ page }) => {
  const nav = generalistSyllabus(page);
  await expect(nav.getByText("Before you start")).toBeVisible();
  const headings = await nav.getByRole("heading").allTextContents();
  const noteIndex = headings.findIndex((text) => text.includes("Before you start"));
  const firstPhaseIndex = headings.findIndex((text) => text.includes("Fixture core"));
  expect(noteIndex).toBeGreaterThanOrEqual(0);
  expect(firstPhaseIndex).toBeGreaterThan(noteIndex);
});

Then("it links every assumed course to its canonical course page without a path query parameter", async ({ page }) => {
  // The assumes note is the syllabus nav's only unordered list — phase courses render as `<ol>`.
  const assumedLinks = generalistSyllabus(page).locator("ul > li > a");
  const expected = [
    { id: "just-enough-python", title: "Just Enough Python" },
    { id: "data-structures-and-algorithms-essentials", title: "Data Structures & Algorithms Essentials" },
    { id: "just-enough-bash", title: "Just Enough Bash" },
    { id: "software-testing", title: "Software Testing" },
    { id: "backend-essentials", title: "Backend Essentials" },
  ];
  await expect(assumedLinks).toHaveCount(expected.length);
  for (const [index, { id, title }] of expected.entries()) {
    await expect(assumedLinks.nth(index)).toHaveText(title);
    await expect(assumedLinks.nth(index)).toHaveAttribute("href", `/en/learn/courses/${id}`);
  }
});

Given("a fixture path lists a course whose frontmatter declares status outline", async ({ page }) => {
  const course = await page.request.get("/en/learn/courses/capstone-secure-service");
  await expect(course).toBeOK();
  const { manifest } = await loadGeneralistTrack(page);
  expect(manifest.courseOrder).toContain("capstone-secure-service");
});

When("a reader opens that path's landing page and then a course in that path", async ({ page }) => {
  await page.goto(GENERALIST_LANDING_URL);
  await page.waitForLoadState("networkidle");
  await page.goto(`/en/learn/courses/software-engineering-practices?path=${GENERALIST_TRACK_PATH}`);
  await page.waitForLoadState("networkidle");
});

Then('the outline course shows a text badge reading "Outline" in the syllabus', async ({ page }) => {
  await page.goto(GENERALIST_LANDING_URL);
  await page.waitForLoadState("networkidle");
  await openOptionalExtensions(page);
  const row = generalistSyllabus(page).locator("ol > li", { hasText: "Capstone · Secure Service" });
  await expect(row.getByText("Outline", { exact: true })).toBeVisible();
});

Then('the same course shows the "Outline" badge in the path rail', async ({ page }) => {
  await page.goto(`/en/learn/courses/software-engineering-practices?path=${GENERALIST_TRACK_PATH}`);
  await page.waitForLoadState("networkidle");
  const row = generalistRail(page).locator("li", { hasText: "Capstone · Secure Service" });
  await expect(row.getByText("Outline", { exact: true })).toBeVisible();
});

Then("a course without status outline shows no badge", async ({ page }) => {
  const row = generalistRail(page).locator("li", { hasText: "Software Engineering Practices" });
  await expect(row.getByText("Outline", { exact: true })).toHaveCount(0);
});
