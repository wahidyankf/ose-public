import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.1d — step binding for
// skills-path-landing-body.feature, reusing the `bodyHtml` prop already proven in
// path-landing.test.tsx's Cycle 3.1d case.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

// The page-level steps (the tab title and the paths hub) render the real route page, which needs the
// same server and content seams the paths hub step file mocks.
const { MockTRPCError, backendTrack } = vi.hoisted(() => {
  class MockTRPCError extends Error {
    code: string;
    constructor({ code, message }: { code: string; message?: string }) {
      super(message);
      this.code = code;
    }
  }
  const backendTrack = {
    pathId: "careers/immediately-effective/backend-track",
    arc: "immediately-effective",
    title: "Backend Track (Immediately-Effective)",
    description: "E2E fixture: the immediately-effective arc's second role.",
    assumes: ["just-enough-python"],
    courseOrder: ["just-enough-bash", "backend-essentials", "sql-essentials"],
    phases: [
      {
        id: "fixture-core",
        title: "Fixture core",
        kind: "core",
        outcome: { can: "complete this fixture path" },
        courses: ["just-enough-bash", "backend-essentials", "sql-essentials"],
      },
    ],
  };
  return { MockTRPCError, backendTrack };
});

vi.mock("@trpc/server", () => ({
  TRPCError: MockTRPCError,
}));

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async () => {
        throw new MockTRPCError({ code: "NOT_FOUND", message: "not found" });
      }),
      getTree: vi.fn(async () => []),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap: new Map(), trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue([backendTrack]),
  defaultManifestsDir: () => "unused-in-test",
}));

vi.mock("@/features/navigation/shell/toc", () => ({
  TableOfContents: () => null,
}));

// eslint-disable-next-line import/first
import ContentPage, { generateMetadata } from "@/app/[locale]/(content)/[...slug]/page";

const alpha: PathManifest = manifestFixture({
  pathId: "skills/e2e-fixture-alpha",
  arc: "skills",
  title: "Alpha Ramp",
  description: "desc",
});
const beta: PathManifest = manifestFixture({
  pathId: "skills/e2e-fixture-beta",
  arc: "skills",
  title: "Beta Ramp",
  description: "desc",
});
const alphaBody = "<p>Alpha's own runway-justification paragraph, unique to alpha.</p>";
const betaBody = "<p>Beta's own runway-justification paragraph, unique to beta.</p>";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: A skills path's authored runway-justification content renders on its own landing
  Scenario(
    "A skills path's authored runway-justification content renders on its own landing",
    ({ Given, When, Then, And }) => {
      Given(
        "two fixture skills paths whose landing bodies declare different runway-justification paragraphs for their differing first boundaries",
        () => {
          expect(alpha.pathId).not.toBe(beta.pathId);
          expect(alphaBody).not.toBe(betaBody);
        },
      );

      When("a reader opens either skills path's landing page", () => {
        cleanup();
        render(<PathLanding locale="en" manifest={alpha} courseTitles={{}} bodyHtml={alphaBody} />);
      });

      Then(
        "that path's landing renders its own authored runway-justification paragraph between the title and the syllabus",
        () => {
          expect(screen.getByText(/unique to alpha/)).toBeTruthy();
        },
      );

      And("the other path's justification paragraph never appears on this page", () => {
        // Still rendering alpha's page from the Then step above — beta's paragraph must be absent.
        expect(screen.queryByText(/unique to beta/)).toBeNull();

        // And the converse: beta's own page must show its own paragraph, never alpha's.
        cleanup();
        render(<PathLanding locale="en" manifest={beta} courseTitles={{}} bodyHtml={betaBody} />);
        expect(screen.getByText(/unique to beta/)).toBeTruthy();
        expect(screen.queryByText(/unique to alpha/)).toBeNull();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: A path landing page tab title reads as the path title
  Scenario("A path landing page tab title reads as the path title", ({ When, Then }) => {
    let tabTitle: unknown;

    When("a reader opens the immediately-effective backend track landing page", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          locale: "en",
          slug: ["learn", "paths", "careers", "immediately-effective", "backend-track"],
        }),
      });
      tabTitle = metadata.title;
    });

    Then('the browser tab title reads "Backend Track (Immediately-Effective)"', () => {
      expect(tabTitle).toBe("Backend Track (Immediately-Effective)");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: An assumed course with no page in this locale shows a readable title, not a raw slug
  Scenario(
    "An assumed course with no page in this locale shows a readable title, not a raw slug",
    ({ Given, When, Then, And }) => {
      let manifest: PathManifest;

      Given(
        'the immediately-effective backend track assumes the course "just-enough-python", which has no page in Indonesian',
        () => {
          manifest = manifestFixture({
            pathId: "careers/immediately-effective/backend-track",
            arc: "immediately-effective",
            title: "Backend Track (Immediately-Effective)",
            description: "desc",
            courses: ["backend-essentials"],
            assumes: ["just-enough-python"],
          });
          expect(manifest.assumes).toEqual(["just-enough-python"]);
        },
      );

      When("a reader opens the backend track landing page in Indonesian", () => {
        cleanup();
        render(<PathLanding locale="id" manifest={manifest} courseTitles={{}} bodyHtml="" />);
      });

      Then('the "Before you start" note links to a course titled "Just Enough Python"', () => {
        expect(screen.getByRole("link", { name: "Just Enough Python" })).toBeTruthy();
      });

      And('no link in that note shows the raw slug "just-enough-python"', () => {
        expect(screen.queryByRole("link", { name: "just-enough-python" })).toBeNull();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-path-landing-body.feature: The paths hub and path landing read in Indonesian under /id
  Scenario("The paths hub and path landing read in Indonesian under /id", ({ When, Then }) => {
    When("a reader opens the paths hub at /id/learn/paths in Indonesian", async () => {
      const jsx = await ContentPage({
        params: Promise.resolve({ locale: "id", slug: ["learn", "paths"] }),
      });
      cleanup();
      render(jsx);
    });

    Then('the hub\'s course library link reads "Jelajahi seluruh pustaka kursus"', () => {
      expect(screen.getByRole("link", { name: /Jelajahi seluruh pustaka kursus/ })).toBeTruthy();
    });

    When("a reader opens the backend track landing page in Indonesian", () => {
      cleanup();
      render(
        <PathLanding
          locale="id"
          manifest={manifestFixture({
            pathId: "careers/immediately-effective/backend-track",
            arc: "immediately-effective",
            title: "Backend Track (Immediately-Effective)",
            description: "desc",
            courses: ["backend-essentials"],
            assumes: ["just-enough-python"],
          })}
          courseTitles={{}}
          bodyHtml=""
        />,
      );
    });

    Then('the "Before you start" heading reads "Sebelum memulai"', () => {
      expect(screen.getByRole("heading", { level: 2, name: "Sebelum memulai" })).toBeTruthy();
    });
  });
});
