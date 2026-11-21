import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

// Unit binding for category-landing-empty-state.feature, reusing the fixtures already proven in
// category-landing.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CategoryLanding } from "@/features/course-paths/shell/category-landing";
import type { PathManifest } from "@/features/course-paths/core/schemas";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/category-landing-empty-state.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/category-landing-empty-state.feature: A category landing with no populated manifest renders an explicit empty state
  Scenario(
    "A category landing with no populated manifest renders an explicit empty state",
    ({ Given, When, Then, And }) => {
      let manifests: PathManifest[];

      Given("a structural category index exists with zero published path manifests", () => {
        manifests = [];
        expect(manifests).toHaveLength(0);
      });

      When("a reader opens that category's landing page", () => {
        cleanup();
        render(<CategoryLanding locale="en" category="careers" manifests={manifests} />);
      });

      Then('the page renders a stated "being written, check back soon" message with a fallback link', () => {
        expect(screen.getByText(/being written/i)).toBeTruthy();
        expect(screen.getByText(/check back soon/i)).toBeTruthy();
        expect(screen.getByRole("link")).toBeTruthy();
      });

      And("the page never renders a blank content area with no message", () => {
        const status = screen.getByRole("alert");
        expect(status.textContent?.trim().length).toBeGreaterThan(0);
      });
    },
  );
});
