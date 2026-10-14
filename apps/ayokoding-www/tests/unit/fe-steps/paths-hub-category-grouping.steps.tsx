import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.4 (aggregate binder) — step
// binding for paths-hub-category-grouping.feature, reusing the fixtures/rendering approach already
// proven in route-paths-hub.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/navigation/shell/toc", () => ({
  TableOfContents: () => null,
}));

const { manifests, contentMap } = vi.hoisted(() => {
  function m(pathId: string, arc: string) {
    // Plan 04 Phase 7: the hub renders `LearnPathCard`, which reads `phases` and `courseOrder` —
    // an empty core phase keeps this fixture about category grouping, not content.
    return {
      pathId,
      arc,
      title: `Title for ${pathId}`,
      description: `Description for ${pathId}`,
      phases: [{ id: "phase-a", title: "Phase A", kind: "core", courses: [] }],
      courseOrder: [],
    };
  }

  const manifestList = [
    m("careers/interview-ready/solo-role", "interview-ready"),
    m("careers/immediately-effective/role-a", "immediately-effective"),
    m("skills/example-subject", "example-track"),
  ];

  return { manifests: manifestList, contentMap: new Map() };
});

const { MockTRPCError } = vi.hoisted(() => {
  class MockTRPCError extends Error {
    code: string;
    constructor({ code, message }: { code: string; message?: string }) {
      super(message);
      this.code = code;
    }
  }
  return { MockTRPCError };
});

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async () => {
        throw new MockTRPCError({ code: "NOT_FOUND", message: "not found" });
      }),
      // Plan 04 Phase 7: the hub route now also reads the lesson-sequence index
      // (`loadLessonPagePaths`) for its cards; an empty tree is the honest boundary here.
      getTree: vi.fn(async () => []),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap, trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue(manifests),
  defaultManifestsDir: () => "unused-in-test",
}));

vi.mock("@trpc/server", () => ({
  TRPCError: MockTRPCError,
}));

// eslint-disable-next-line import/first
import ContentPage from "@/app/[locale]/(content)/[...slug]/page";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/paths-hub-category-grouping.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("The paths hub groups paths by category, not a flat grid", ({ Given, When, Then, And }) => {
    let jsx: React.ReactElement;

    Given("a fixture manifest set covers both a careers-shaped and a skills-shaped fixture", () => {
      expect(manifests.some(({ pathId }) => pathId.startsWith("careers/"))).toBe(true);
      expect(manifests.some(({ pathId }) => pathId.startsWith("skills/"))).toBe(true);
    });

    When("a reader opens the paths hub at /en/learn/paths", async () => {
      jsx = await ContentPage({
        params: Promise.resolve({ locale: "en", slug: ["learn", "paths"] }),
      });
      cleanup();
      render(jsx);
    });

    Then("the hub renders a Careers section grouped by arc and a separate Skills section", () => {
      expect(screen.getByRole("heading", { level: 2, name: /careers/i })).toBeTruthy();
      expect(screen.getByRole("heading", { level: 2, name: /skills/i })).toBeTruthy();
    });

    And("no path card from either category is rendered outside its category's section", () => {
      const careersSection = document.querySelector("section[aria-labelledby='careers-heading']");
      const skillsSection = document.querySelector("section[aria-labelledby='skills-heading']");
      expect(careersSection).not.toBeNull();
      expect(skillsSection).not.toBeNull();
      expect(careersSection?.querySelector("a[href*='example-subject']")).toBeNull();
      expect(skillsSection?.querySelector("a[href*='interview-ready']")).toBeNull();
    });
  });
});
