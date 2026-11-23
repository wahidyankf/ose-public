import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The AI benchmark route (`/tools/ai-benchmark`) renders a client component that reads its locale
// and URL state via `next/navigation` hooks — needed only for the EWT-001 landmark-count scenario
// below, which renders that route alongside the tools index page.
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/en/tools/ai-benchmark",
  notFound: vi.fn(),
}));

import "./helpers/test-setup";
import ToolsIndexPage from "@/app/[locale]/tools/page";
import AiBenchmarkPage from "@/app/[locale]/tools/ai-benchmark/page";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature"),
);

// The tool entries of the tools index, keyed by the feature's Examples value: each entry's link
// name and the test id of its description element.
const TOOL_ENTRIES: Record<string, { link: RegExp; descriptionTestId: string }> = {
  "Cost of living calculator": { link: /cost of living calculator/i, descriptionTestId: "tool-desc-calculator" },
  "AI benchmark": { link: /ai (model )?benchmark/i, descriptionTestId: "tool-desc-ai-benchmark" },
};

describeFeature(feature, ({ ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature: Each tool entry on the tools index has a description distinct from its link text
  ScenarioOutline(
    "Each tool entry on the tools index has a description distinct from its link text",
    ({ Given, When, Then }, variables) => {
      let link: HTMLElement;
      const entry = TOOL_ENTRIES[String(variables.tool)];
      if (entry === undefined) throw new Error(`unknown tool entry: ${String(variables.tool)}`);

      Given("I am on the tools index page", async () => {
        const jsx = await ToolsIndexPage({ params: Promise.resolve({ locale: "en" as const }) });
        render(jsx);
      });

      When('the "<tool>" entry renders', () => {
        link = screen.getByRole("link", { name: entry.link });
        expect(link).toBeTruthy();
      });

      Then('the "<tool>" entry shows a description distinct from its link text', () => {
        const desc = screen.getByTestId(entry.descriptionTestId);
        expect((desc.textContent ?? "").trim()).not.toBe("");
        expect((desc.textContent ?? "").trim()).not.toBe((link.textContent ?? "").trim());
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature: tools index in both locales
  ScenarioOutline("tools index in both locales", ({ Given, When, Then, And }, variables) => {
    Given('a user navigates to "<path>"', async () => {
      // The locale is the first segment of the path, e.g. "/id/tools" renders the Indonesian page.
      const locale = String(variables.path).split("/")[1] as "en" | "id";
      const jsx = await ToolsIndexPage({ params: Promise.resolve({ locale }) });
      render(jsx);
    });

    // Rule-15 EWT-001 fix: the page's own wrapper is a plain `<div>`, not `<main>`, so the heading is
    // asserted instead of a landmark role (see the EWT-001 scenario below).
    When("the page renders", () => {
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    });

    Then('the page heading reads "<heading>" and the calculator link reads "<calculator_link>"', () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(String(variables.heading));
      expect(screen.getByRole("link", { name: String(variables.calculator_link) })).toBeTruthy();
    });

    And("no raw i18n key strings are visible", () => {
      expect(document.body.textContent).not.toMatch(/toolsPage[A-Z]/);
    });
  });

  // EWT-001 (Rule-15 retest regression, pr-review-synthesis-maker HIGH finding, PR #122 cycle 1):
  // both Tools pages' page-level wrapper was a nested `<main>` inside the app shell's own
  // `<main id="main-content">`, producing two `role="main"` landmarks — invalid HTML5 and a WCAG
  // 4.1.2/1.3.1 defect. Unlike AC-38's contrast case, jsdom fully supports DOM STRUCTURE with no
  // CSS needed, so this is a REAL (non-placeholder) assertion, not an `expect(true)` stand-in: an
  // isolated render of either page's own component tree (i.e. WITHOUT `layout.tsx`, which is not
  // rendered here and supplies the page's one real landmark) must contain ZERO `<main>` elements —
  // this would have failed against the pre-fix markup (`<main>` in both `tools/page.tsx` and
  // `benchmark-content.tsx`) and passes against the corrected `<div>` wrapper. The e2e binding
  // (`apps/ayokoding-www-fe-e2e/tests/e2e/steps/tools-index.steps.ts`) is the one asserting the REAL
  // assembled page's total count is exactly 1.
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature: Exactly one main landmark renders on the Tools pages
  ScenarioOutline("Exactly one main landmark renders on the Tools pages", ({ When, Then }, variables) => {
    When('I navigate to "<path>"', async () => {
      const examplePath = String(variables.path);
      if (examplePath === "/en/tools/ai-benchmark") {
        render(React.createElement(AiBenchmarkPage));
      } else {
        const jsx = await ToolsIndexPage({ params: Promise.resolve({ locale: "en" as const }) });
        render(jsx);
      }
    });

    Then("exactly one main landmark is present", () => {
      expect(document.querySelectorAll("main").length).toBe(0);
    });
  });
});
