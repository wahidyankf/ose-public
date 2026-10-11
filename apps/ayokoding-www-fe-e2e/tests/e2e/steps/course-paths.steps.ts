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

Then("the courses appear in the fixture manifest's courseOrder", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: /backend track \(interview-ready\) syllabus/i });
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

// The literal parentheses in the Gherkin step text ("role(s)") must be escaped (`\\(`/`\\)`) —
// Cucumber Expressions otherwise parse unescaped `(text)` as optional-text syntax, which would
// match "role" or "roles" but never the literal characters "role(s)" the feature file contains.
Then("the page renders one arc card per arc with its member role\\(s\\) previewed", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Careers arcs" });
  const arcCards = nav.getByRole("link");
  await expect(arcCards).toHaveCount(3);
  const expectedCards = [
    {
      name: "Explore the Fundamentally Strong arc — Generalist Track",
      href: "/en/learn/paths/careers/fundamentally-strong",
      roles: ["Generalist Track"],
    },
    {
      name: "Explore the Immediately-Effective arc — Backend Track, Frontend Track",
      href: "/en/learn/paths/careers/immediately-effective",
      roles: ["Backend Track", "Frontend Track"],
    },
    {
      name: "Explore the Interview-Ready arc — Backend Track",
      href: "/en/learn/paths/careers/interview-ready",
      roles: ["Backend Track"],
    },
  ];
  for (const expected of expectedCards) {
    const card = nav.getByRole("link", { name: expected.name, exact: true });
    await expect(card).toHaveAttribute("href", expected.href);
    await expect(card.getByRole("listitem")).toHaveText(expected.roles);
  }
});

Then("the immediately-effective arc card previews exactly two member roles", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Careers arcs" });
  // Exact humanized casing (no `i` flag): the arc card's accessible name renders the arc's
  // humanized/authored title (UWT-001 fix, phase-5 rule-15 retest — `category-landing.tsx`'s
  // `ArcCard` builds its `aria-label` from `arcTitle`, not the raw `arc` slug), e.g. "Explore the
  // Immediately-Effective arc — …", never the raw kebab-case slug this regex originally matched.
  // A case-insensitive flag here would pass identically for either the pre-fix raw slug or the
  // post-fix humanized title (they differ only in case), so it must stay case-sensitive to detect
  // a regression back to the raw-slug defect this assertion exists to catch.
  const arcCard = nav.getByRole("link", { name: /Explore the Immediately-Effective arc/ });
  await expect(arcCard).toBeVisible();
  const roleBadges = arcCard.getByRole("listitem");
  await expect(roleBadges).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Cycle 3.1b-ii — skills category landing fixed-arc statement (skills-fixed-arc-statement.feature)
// ---------------------------------------------------------------------------

Given("a fixture skills manifest set is loaded", async ({ page }) => {
  const manifests = await loadPublishedManifests(page);
  expect(manifests.filter((manifest) => manifest.pathId?.startsWith("skills/"))).toHaveLength(2);
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
  const cards = nav.getByRole("link");
  await expect(cards).toHaveCount(2);
  await expect(page.getByText("~2 courses")).toBeVisible();
  await expect(page.getByText("~3 courses")).toBeVisible();
});

Then("neither card is a placeholder or an empty grid cell", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "immediately-effective paths" });
  await expect(nav.getByRole("link", { name: /Start the Frontend Track/ })).toBeVisible();
  await expect(nav.getByRole("link", { name: /Start the Backend Track/ })).toBeVisible();
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

Then("the single role card renders with an inline first-phase syllabus preview", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "interview-ready paths" });
  const card = nav.getByRole("link", {
    name: "Start the Backend Track (Interview-Ready) path — 2 courses",
    exact: true,
  });
  await expect(card).toHaveAttribute("href", "/en/learn/paths/careers/interview-ready/backend-track");
  const previewItems = card.locator("xpath=..").locator("ol > li");
  await expect(previewItems).toHaveCount(2);
  // Numbered preview (plan ayokoding-learn-revamp-01 §4.2): each inline item renders its path
  // position before the title, separated by " · " from the previous item.
  await expect(previewItems.nth(0)).toContainText("1 Just Enough Python");
  await expect(previewItems.nth(1)).toContainText("2 Data Structures & Algorithms Essentials");
});

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
// just-enough-python in four career paths.
Given(
  "a reader opens a course URL \\/en\\/learn\\/courses\\/<course-id> with no path context query parameter",
  async ({ page }) => {
    await page.goto("/en/learn/courses/just-enough-python");
  },
);

When("the course page renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the course body renders in full with the content-tree breadcrumb and its prerequisite list", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  const article = page.getByRole("article");
  await expect(article.getByRole("heading", { level: 1, name: "Just Enough Python", exact: true })).toBeVisible();
  await expect(article.getByRole("link", { name: "Learning", exact: true })).toHaveAttribute(
    "href",
    "/en/learn/courses/just-enough-python/learning",
  );
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites.getByRole("link", { name: "Capstone · Forge-Ready", exact: true })).toHaveAttribute(
    "href",
    "/en/learn/courses/capstone-forge-ready",
  );
});

Then('a "this course is part of" affordance lists every path that includes the course', async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "This course is part of" });
  const paths = (await loadPublishedManifests(page)).filter(({ courseOrder }) =>
    courseOrder.includes("just-enough-python"),
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
  const navigation = page.getByRole("navigation", { name: "Page navigation" });
  const expectedContext = "?path=careers/immediately-effective/backend-track";
  await expect(navigation.getByRole("link", { name: /Just Enough Bash/i })).toHaveAttribute(
    "href",
    `/en/learn/courses/just-enough-bash${expectedContext}`,
  );
  await expect(navigation.getByRole("link", { name: /SQL Essentials/i })).toHaveAttribute(
    "href",
    `/en/learn/courses/sql-essentials${expectedContext}`,
  );
});

Given("a reader opens a course in path context on a desktop-width viewport", async ({ page }) => {
  await page.goto("/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track");
});

Then("the left rail lists that path's courses in manifest order with the current course marked", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
  const items = nav.getByRole("listitem");
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
});

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
  /^the path crumb links to the path landing page \/en\/learn\/paths\/<path-id> with the path context preserved$/,
  async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", {
        name: "Backend Track (Immediately-Effective)",
      }),
    ).toHaveAttribute(
      "href",
      "/en/learn/paths/careers/immediately-effective/backend-track?path=careers/immediately-effective/backend-track",
    );
  },
);

Given("a course declares prerequisites in its canonical metadata", async ({ page }) => {
  const response = await page.request.get("/en/learn/courses/just-enough-python");
  await expect(response).toBeOK();
});

When("a reader opens the course page with or without a path context", async ({ page }) => {
  await page.goto("/en/learn/courses/just-enough-python");
  await page.waitForLoadState("networkidle");
});

Then("the page lists each prerequisite course with a link to its canonical URL", async ({ page }) => {
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites.getByRole("link", { name: "Capstone · Forge-Ready" })).toHaveAttribute(
    "href",
    "/en/learn/courses/capstone-forge-ready",
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
});

When("a reader opens that path's landing page", async ({ page }) => {
  await page.goto("/en/learn/paths/careers/immediately-effective/backend-track");
  await page.waitForLoadState("networkidle");
});

Then("each syllabus row shows its position number starting at 1 before the course title", async ({ page }) => {
  const syllabus = page.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
  const rows = syllabus.getByRole("listitem");
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
  const rows = syllabus.getByRole("listitem");
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
  const card = nav.getByRole("link", { name: /^Start the Backend Track \(Interview-Ready\) path/ });
  const previewItems = card.locator("xpath=..").locator("ol > li");
  await expect(previewItems).toHaveCount(2);
  const texts = await previewItems.allTextContents();
  // The inline separator " · " precedes every number except the first, so the second item's
  // textContent starts with it; trailing/leading whitespace is trimmed here only.
  expect(texts[0]?.trim()).toBe("1 Just Enough Python");
  expect(texts[1]?.trim()).toBe("· 2 Data Structures & Algorithms Essentials");
});

Then("no preview item shows a second number inside the course title", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "interview-ready paths" });
  const card = nav.getByRole("link", { name: /^Start the Backend Track \(Interview-Ready\) path/ });
  const previewItems = card.locator("xpath=..").locator("ol > li");
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
// sql-essentials is the last of the backend-track fixture's three courses, so at the 1280×200
// viewport below its row starts below the visible part of the sidebar. The When step ("the page
// renders") is shared with cost-of-living-calculator.steps.ts (identical networkidle semantics) —
// not redefined here, same as the canonical-fallback scenario above.
// ---------------------------------------------------------------------------

const RAIL_SCROLL_VIEWPORT = { width: 1280, height: 200 };

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
