import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.1b-i — step binding for
// category-landing-arc-chooser.feature, reusing the careers fixture already proven in
// category-landing.test.tsx. Rewritten in plan ayokoding-learn-revamp-04 Phase 7 (U3): the arc
// chooser's `ArcCard`s became one arc-headed section of shared `LearnPathCard`s.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CategoryLanding } from "@/features/course-paths/shell/category-landing";

function manifest(overrides: Pick<PathManifest, "pathId" | "arc">): PathManifest {
  return manifestFixture({ title: overrides.pathId, description: "desc", ...overrides });
}

const interviewReady = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
const immediatelyA = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });
const immediatelyB = manifest({ pathId: "careers/immediately-effective/role-c", arc: "immediately-effective" });
const fundamentallyStrong = manifest({ pathId: "careers/fundamentally-strong/role-d", arc: "fundamentally-strong" });

const ARCS = [
  { arc: "interview-ready", title: "Interview Ready" },
  { arc: "immediately-effective", title: "Immediately Effective" },
  { arc: "fundamentally-strong", title: "Fundamentally Strong" },
] as const;

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/category-landing-arc-chooser.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("The careers category landing groups path cards by arc", ({ Given, When, Then, And }) => {
    Given("a fixture careers manifest set with three arcs is loaded", () => {
      const arcs = new Set([interviewReady, immediatelyA, immediatelyB, fundamentallyStrong].map(({ arc }) => arc));
      expect(arcs).toEqual(new Set(["interview-ready", "immediately-effective", "fundamentally-strong"]));
    });

    When("a reader opens the careers category landing at /en/learn/paths/careers/", () => {
      cleanup();
      render(
        <CategoryLanding
          locale="en"
          category="careers"
          manifests={[interviewReady, immediatelyA, immediatelyB, fundamentallyStrong]}
        />,
      );
    });

    Then("the page renders one section per arc, each arc heading linking to the arc page", () => {
      // No `contentMap` is passed, so each arc title falls back to `humanizeKebabSlug` (UWT-001
      // fix) — "Immediately Effective", never the raw "immediately-effective" slug.
      const nav = within(screen.getByRole("navigation", { name: "Careers arcs" }));
      expect(nav.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(
        ARCS.map(({ title }) => title),
      );

      for (const { arc, title } of ARCS) {
        const heading = screen.getByRole("heading", { level: 2, name: title });
        expect(within(heading).getByRole("link", { name: title }).getAttribute("href")).toBe(
          `/en/learn/paths/careers/${arc}`,
        );
      }
    });

    And("the immediately-effective section shows exactly two path cards", () => {
      const section = document.querySelector("section[aria-labelledby='careers-arc-immediately-effective']");
      expect(section).not.toBeNull();
      expect(section?.querySelectorAll(":scope > ul > li").length).toBe(2);
      // Each is the shared `LearnPathCard`, not the replaced arc-preview card.
      expect(within(section as HTMLElement).getAllByRole("link", { name: /View path/ }).length).toBe(2);
    });
  });
});
