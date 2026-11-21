// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns HTML, page metadata, and headings
// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns previous and next links
// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get non-existent page by slug returns 404
// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Child pages are ordered by weight ascending through <surface>
// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Page content includes rendered HTML with code blocks preserved
// @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: The course-path route data is returned for a locale
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

type TreeNode = { slug: string; children: TreeNode[] };

const { When, Then } = createBdd();

function findNode(nodes: TreeNode[], slug: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const nested = findNode(node.children, slug);
    if (nested) return nested;
  }
  return undefined;
}

Then('the response should contain a non-null "html" field', async () => {
  expect((state.pageResult as { html: string }).html).toBeTruthy();
});

Then("the response should contain the page metadata for the requested slug", async () => {
  expect(state.pageResult).toMatchObject({
    title: "Beginner Examples",
    slug: "learn/courses/just-enough-go/learning/beginner",
    locale: "en",
    weight: 10,
    draft: false,
    isSection: false,
  });
});

Then('the response should contain a non-null "headings" field', async () => {
  expect((state.pageResult as { headings: unknown[] }).headings).toBeInstanceOf(Array);
});

Then('the response should contain a "prev" navigation link', async () => {
  expect(state.pageResult).toMatchObject({
    prev: { title: "Overview", slug: "learn/courses/just-enough-go/learning/overview" },
  });
});

Then('the response should contain a "next" navigation link', async () => {
  expect(state.pageResult).toMatchObject({
    next: {
      title: "Intermediate Examples",
      slug: "learn/courses/just-enough-go/learning/intermediate",
    },
  });
});

Then("the response should indicate the page was not found", async () => {
  const errors = state.errorResult as { error?: { json?: { data?: { code?: string } } } }[];
  expect(errors[0]?.error?.json?.data?.code).toBe("NOT_FOUND");
});

Then("the response should reject the invalid locale as a bad request", async () => {
  const errors = state.errorResult as { error?: { json?: { data?: { code?: string } } } }[];
  expect(errors[0]?.error?.json?.data?.code).toBe("BAD_REQUEST");
});

When(
  "the client reads the child pages of {string} through {word}",
  async ({ request }, slugWithLocale: string, surface: string) => {
    const [locale = "", ...parts] = slugWithLocale.split("/");
    const parentSlug = parts.join("/");
    if (surface === "content.listChildren") {
      const response = await request.get(buildTrpcUrl("content.listChildren", { locale, parentSlug }));
      expect(response.ok()).toBeTruthy();
      state.childrenResult = extractTrpcData(await response.json());
      return;
    }
    if (surface === "content.getTree") {
      const response = await request.get(buildTrpcUrl("content.getTree", { locale }));
      expect(response.ok()).toBeTruthy();
      const tree = extractTrpcData(await response.json()) as TreeNode[];
      state.childrenResult = findNode(tree, parentSlug)?.children ?? [];
      return;
    }
    throw new Error(`unknown child-page surface: ${surface}`);
  },
);

Then("the response should contain 5 child pages", async () => {
  expect(state.childrenResult).toHaveLength(5);
});

Then("the child pages should be ordered by weight ascending", async () => {
  const weights = (state.childrenResult as { weight: number }[]).map(({ weight }) => weight);
  expect(weights).toEqual([...weights].sort((a, b) => a - b));
});

Then('the response "html" field should contain a rendered code element', async () => {
  expect((state.pageResult as { html: string }).html).toContain("<code");
});

// AYW-069: the course-path route data is read over the same tRPC HTTP route the pages call on the served site.
When("the client calls coursePaths.getRouteData with locale {string}", async ({ request }, locale: string) => {
  const response = await request.get(buildTrpcUrl("coursePaths.getRouteData", locale));
  expect(response.ok()).toBeTruthy();
  state.routeDataResult = extractTrpcData(await response.json());
});

Then("the response should list each library course with its English page link", async () => {
  const routeData = state.routeDataResult as {
    libraryCourseIds: string[];
    courseLinks: Record<string, { slug: string }>;
  };
  expect(routeData.libraryCourseIds.length).toBeGreaterThan(0);
  for (const courseId of routeData.libraryCourseIds) {
    expect(routeData.courseLinks[courseId], `${courseId} has no English page link`).toMatchObject({
      slug: `learn/courses/${courseId}`,
    });
  }
});

Then("the response should include the course path manifests", async () => {
  expect(Array.isArray((state.routeDataResult as { manifests: unknown }).manifests)).toBe(true);
});
