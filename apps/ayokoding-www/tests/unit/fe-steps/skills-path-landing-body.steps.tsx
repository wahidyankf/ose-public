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
});
