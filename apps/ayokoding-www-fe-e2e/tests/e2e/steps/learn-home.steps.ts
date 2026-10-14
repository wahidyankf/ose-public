import { createBdd } from "playwright-bdd";
import { expect, type APIResponse, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";
import { getResilient } from "../support/resilient-request";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 6 — the Learn home
// (learning-progress/learn-home.feature, S27–S31a).
//
// The unit bindings for the same scenarios live in
// `apps/ayokoding-www/tests/unit/fe-steps/learn-home.steps.tsx`: they render `LearnHome` against
// in-memory manifests, while these steps prove the same reader experience in a real browser
// against the fixture manifest set (`apps/ayokoding-www-fe-e2e/fixtures/manifests/`).
// ---------------------------------------------------------------------------

const PATH_ID = "careers/immediately-effective/backend-track";
const BASH_ID = "just-enough-bash";
const BASH_TITLE = "Just Enough Bash";
/** Where the Continue card sends a reader who has finished the path's first lesson page. */
const NEXT_LESSON_LINK = `/en/learn/courses/${BASH_ID}/learning/beginner?path=${PATH_ID}`;

interface HomeManifest {
  pathId: string;
  arc: string;
  title: string;
  description?: string;
  goals?: string[];
  phases?: { id: string; kind: string; courses: string[] }[];
  /** Set on a skills path still waiting for its restructure; decides which progress wording it uses. */
  restructurePendingIn?: string;
}

/** The manifests the running server publishes — the same fixture truth the path pages assert. */
async function publishedManifests(page: Page): Promise<HomeManifest[]> {
  const response = await getResilient(page, buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as { manifests?: HomeManifest[] };
  return data.manifests ?? [];
}

/** The career-path manifests, in the order the server publishes them. */
async function careerManifests(page: Page): Promise<HomeManifest[]> {
  const manifests = (await publishedManifests(page)).filter((manifest) => manifest.pathId.startsWith("careers/"));
  expect(manifests.length, "the fixture set publishes at least one career path").toBeGreaterThan(0);
  return manifests;
}

/** The Learn index page's own title/description, the copy the home renders. */
async function learnIndexPage(page: Page): Promise<{ title: string; description?: string }> {
  const response = await getResilient(page, buildTrpcUrl("content.getBySlug", { locale: "en", slug: "learn" }));
  await expect(response).toBeOK();
  return extractTrpcData(await response.json()) as { title: string; description?: string };
}

async function openLearnHome(page: Page): Promise<void> {
  await page.goto("/en/learn");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "Learn" })).toBeVisible();
}

/** The raw response of the last redirect probe, read by the two redirect scenarios below. */
let redirectResponse: APIResponse | null = null;

// ---------------------------------------------------------------------------
// S27 — the Learn home is a landing page, not a list of courses.
// ---------------------------------------------------------------------------

When("a reader opens \\/en\\/learn", async ({ page }) => {
  await openLearnHome(page);
});

Then(
  "the page shows an introduction, career path cards, skills path cards, and a {string} link to the catalog",
  async ({ page }, catalogLinkName: string) => {
    // The introduction is the Learn index page's own description (tech-docs/004), not new copy.
    const index = await learnIndexPage(page);
    expect(index.description, "the Learn index page must carry the intro copy").toBeTruthy();
    await expect(page.getByText(index.description as string)).toBeVisible();

    // Career cards sit under the anchored career-paths section; skill cards under their own.
    const careerCards = page.locator('#career-paths a[href^="/en/learn/paths/careers/"]');
    expect(await careerCards.count(), "the career paths section lists at least one card").toBeGreaterThan(0);
    const skillCards = page.locator('[aria-labelledby="skill-paths-heading"] a[href^="/en/learn/paths/skills/"]');
    expect(await skillCards.count(), "the skill paths section lists at least one card").toBeGreaterThan(0);

    await expect(page.getByRole("link", { name: catalogLinkName })).toHaveAttribute("href", "/en/learn/courses");
  },
);

Then("the page links to no individual course page", async ({ page }) => {
  const coursePageLinks = await page
    .locator('a[href^="/en/learn/courses/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(coursePageLinks).toEqual([]);
});

// ---------------------------------------------------------------------------
// S28 — a returning reader sees a Continue learning card.
// ---------------------------------------------------------------------------

Given("a reader completed some learning pages while following a path", async ({ page }) => {
  // The fixture path's first course, its first lesson page, marked through the lesson page's own
  // completion control in path context — the same action a reader performs, and the record the
  // Learn home's card reads back.
  await page.goto(`/en/learn/courses/${BASH_ID}/learning/overview?path=${PATH_ID}`);
  await page.waitForLoadState("networkidle");
  const toggle = page.getByRole("navigation", { name: "Page navigation" }).getByRole("button");
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

When("the reader opens \\/en\\/learn", async ({ page }) => {
  await openLearnHome(page);
});

Then("a {string} card names that path and its next course", async ({ page }, cardLabel: string) => {
  const path = (await publishedManifests(page)).find((manifest) => manifest.pathId === PATH_ID);
  expect(path, `the running server must publish the ${PATH_ID} fixture manifest`).toBeDefined();

  const button = page.getByRole("link", { name: /^Continue:/ });
  const card = button.locator("xpath=ancestor::div[1]");
  await expect(card).toContainText(cardLabel);
  await expect(card).toContainText(path?.title ?? "");
  await expect(button).toContainText(BASH_TITLE);
});

Then("its button links to the next learning page in path context", async ({ page }) => {
  await expect(page.getByRole("link", { name: /^Continue:/ })).toHaveAttribute("href", NEXT_LESSON_LINK);
});

// ---------------------------------------------------------------------------
// S29 — a new reader sees a Start learning card in the same place. Its Given, "a reader has no
// saved progress", is defined once in `progress-store.steps.ts` and shared here.
// ---------------------------------------------------------------------------

Then("the same card area shows {string} with a link to the paths", async ({ page }, cardLabel: string) => {
  const link = page.locator('a[href="/en/learn#career-paths"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/en/learn#career-paths");
  await expect(link.locator("xpath=ancestor::div[1]")).toContainText(cardLabel);
});

// ---------------------------------------------------------------------------
// S30 — every career path card carries the same set of facts.
// ---------------------------------------------------------------------------

Then(
  "each career path card shows the path title, who it is for, its goal, its core phase count, its estimated time, and its progress in words",
  async ({ page }) => {
    for (const manifest of await careerManifests(page)) {
      const title = page.getByRole("link", { name: manifest.title, exact: true });
      await expect(title).toBeVisible();
      const card = title.locator("xpath=ancestor::li[1]");

      const phases = manifest.phases ?? [];
      const coreCourses = phases.filter((phase) => phase.kind === "core").flatMap((phase) => phase.courses);
      const corePhaseCount = phases.filter((phase) => phase.kind === "core").length;
      const extensionCount = phases.filter((phase) => phase.kind === "extension").length;

      await expect(title).toHaveText(manifest.title); // the path title
      await expect(card).toContainText(manifest.description ?? ""); // who it is for
      await expect(card).toContainText(`${corePhaseCount} core phases · ${extensionCount} optional`); // its size
      await expect(card).toContainText(/About \d+ h/); // its estimated time
      await expect(card).toContainText(new RegExp(`\\d+ of ${coreCourses.length} core courses done`));
      await expect(card).toContainText(/Not started|In progress|Done/); // its progress in words

      // The fixture manifests declare no goals (fixtures/manifests/README.md), so the goal line
      // is asserted as the rule it is: present exactly when the manifest declares goals.
      if ((manifest.goals ?? []).length === 0) {
        await expect(card).not.toContainText("Goal:");
      } else {
        await expect(card).toContainText("Goal:");
      }
    }
  },
);

Then("each card links to its path page", async ({ page }) => {
  for (const manifest of await careerManifests(page)) {
    const href = `/en/learn/paths/${manifest.pathId}`;
    const title = page.getByRole("link", { name: manifest.title, exact: true });
    await expect(title).toHaveAttribute("href", href);
    await expect(title.locator("xpath=ancestor::li[1]").getByRole("link", { name: /View path/ })).toHaveAttribute(
      "href",
      href,
    );
  }
});

// ---------------------------------------------------------------------------
// S31/S31a — the retired overview address and the address beneath it.
// ---------------------------------------------------------------------------

When("a visitor requests \\/en\\/learn\\/overview", async ({ page }) => {
  // A raw request with redirects disabled (`getResilient` is `page.request.get` plus one retry
  // for the shared server's transient connection resets), so the 308 itself is asserted.
  redirectResponse = await getResilient(page, "/en/learn/overview", { maxRedirects: 0 });
});

Then("the response is a permanent redirect with status 308 to \\/en\\/learn", () => {
  expect(redirectResponse, "the When step must capture the raw response").not.toBeNull();
  expect(redirectResponse?.status()).toBe(308);
  const location = redirectResponse?.headers()["location"] ?? "";
  expect(location, "a 308 must carry the destination").not.toBe("");
  expect(new URL(location, "http://localhost").pathname).toBe("/en/learn");
});

When("a visitor requests \\/en\\/learn\\/overview\\/anything", async ({ page }) => {
  redirectResponse = await getResilient(page, "/en/learn/overview/anything", { maxRedirects: 0 });
});

Then("the response status is 404", () => {
  expect(redirectResponse, "the When step must capture the raw response").not.toBeNull();
  expect(redirectResponse?.status()).toBe(404);
});

// ---------------------------------------------------------------------------
// S32 — the path hubs render the same path cards, with their progress in words. The When step
// visits all four screens the scenario names (the paths hub, the careers landing, a careers arc
// page, and the skills landing) and records each page's rendered cards; the two following steps
// assert what those pages showed.
// ---------------------------------------------------------------------------

interface HubCard {
  title: string;
  href: string;
  progress: string;
}

interface HubPage {
  url: string;
  pathIds: string[];
  cards: HubCard[];
  arcHeadings: { title: string; href: string }[];
}

let hubPages: HubPage[] = [];

/**
 * The page chrome that addresses the very same `/en/learn/paths/...` pages as the cards do. The
 * sidebar rail renders one `<li>` per path page, labelled with that page's own content title, and
 * it sits before the page's own content in the DOM — on `/en/learn/paths/skills` its
 * "Conventional Accounting" entry (`content/en/learn/paths/skills/conventional-accounting/_index.md`'s
 * title) would otherwise be read as the `skills/conventional-accounting` fixture path's card, whose
 * manifest title is "Conventional Accounting Skills Path". Cards are therefore read only from
 * outside every one of these regions.
 */
const PATH_LINK_CHROME = 'nav[aria-label="Sidebar navigation"], header, footer';

/** Every path card on the open page: its own title link, its href, and its progress line. */
async function readPathCards(page: Page): Promise<HubCard[]> {
  const cards = await page.locator("li:has(a[href^='/en/learn/paths/'])").evaluateAll(
    (items, chrome) =>
      items
        .filter((item) => item.closest(chrome) === null)
        .map((item) => {
          // A `LearnPathCard` list item's own title link is the first `/en/learn/paths/...` link it
          // renders; the second is its trailing "View path" link to that same address.
          const title = item.querySelector("a[href^='/en/learn/paths/']");
          return {
            title: title?.textContent?.trim() ?? "",
            href: title?.getAttribute("href") ?? "",
            progress: item.textContent ?? "",
          };
        }),
    PATH_LINK_CHROME,
  );
  return cards;
}

When(
  "a reader opens the paths hub, the careers landing, a careers arc page, or the skills landing",
  async ({ page }) => {
    const manifests = await publishedManifests(page);
    const careers = manifests.filter((manifest) => manifest.pathId.startsWith("careers/"));
    const skills = manifests.filter((manifest) => manifest.pathId.startsWith("skills/"));

    const targets: { url: string; pathIds: string[] }[] = [
      { url: "/en/learn/paths", pathIds: manifests.map(({ pathId }) => pathId) },
      { url: "/en/learn/paths/careers", pathIds: careers.map(({ pathId }) => pathId) },
      {
        url: "/en/learn/paths/careers/immediately-effective",
        pathIds: careers
          .filter(({ pathId }) => pathId.startsWith("careers/immediately-effective/"))
          .map(({ pathId }) => pathId),
      },
      { url: "/en/learn/paths/skills", pathIds: skills.map(({ pathId }) => pathId) },
    ];

    hubPages = [];
    for (const target of targets) {
      await page.goto(target.url);
      await page.waitForLoadState("networkidle");
      const arcHeadings = await page
        .locator('section[aria-labelledby^="careers-arc-"] h2 a')
        .evaluateAll((links) =>
          links.map((link) => ({ title: link.textContent?.trim() ?? "", href: link.getAttribute("href") ?? "" })),
        );
      hubPages.push({ ...target, cards: await readPathCards(page), arcHeadings });
    }
  },
);

Then("every path on the page is shown as a path card with its progress in words", async ({ page }) => {
  expect(hubPages.length, "the When step must visit all four screens").toBe(4);

  for (const hubPage of hubPages) {
    const manifests = await publishedManifests(page);
    expect(hubPage.pathIds.length, `${hubPage.url} publishes at least one path`).toBeGreaterThan(0);

    for (const pathId of hubPage.pathIds) {
      const manifest = manifests.find((candidate) => candidate.pathId === pathId);
      expect(manifest, `${hubPage.url} must publish ${pathId}`).toBeDefined();
      const card = hubPage.cards.find((candidate) => candidate.href === `/en/learn/paths/${pathId}`);
      expect(card, `${hubPage.url} must show the ${pathId} path card`).toBeDefined();
      expect(card?.title).toBe(manifest?.title);
      // A pending-restructure skills path counts all its courses; a core path counts core courses only.
      const progressPattern = manifest?.restructurePendingIn
        ? /\d+ of \d+ courses done/
        : /\d+ of \d+ core courses done/;
      expect(card?.progress).toMatch(progressPattern);
      expect(card?.progress).toMatch(/Not started|In progress|Done/);
    }
  }
});

Then(
  "the careers landing groups its path cards under one heading per arc that links to the arc page",
  async ({ page }) => {
    const careersLanding = hubPages.find((hubPage) => hubPage.url === "/en/learn/paths/careers");
    expect(careersLanding, "the When step must visit the careers landing").toBeDefined();

    const careers = (await publishedManifests(page)).filter(({ pathId }) => pathId.startsWith("careers/"));
    const expectedArcs = [...new Set(careers.map((manifest) => manifest.pathId.split("/")[1] ?? ""))];

    expect(careersLanding?.arcHeadings.map(({ href }) => href)).toEqual(
      expectedArcs.map((arc) => `/en/learn/paths/careers/${arc}`),
    );
    for (const { title } of careersLanding?.arcHeadings ?? []) {
      expect(title, "each arc heading names its arc, never the raw slug").not.toBe("");
    }

    // Back on the careers landing: no arc-chooser card remains — the headings replaced it.
    await page.goto("/en/learn/paths/careers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /Explore the .* arc/ })).toHaveCount(0);
  },
);
