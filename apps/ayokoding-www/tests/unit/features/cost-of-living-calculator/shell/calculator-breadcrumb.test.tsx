import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "@/features/i18n/core/translations";

// Locale is controlled per-test via this mutable holder so we can render both
// en and id without re-importing the component.
const { localeHolder } = vi.hoisted(() => ({ localeHolder: { value: "en" } }));

vi.mock("@/features/i18n/shell/use-locale", () => ({
  useLocale: () => localeHolder.value,
}));

// Mock next/link as a simple <a> tag.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Import after mocks are registered.
// eslint-disable-next-line import/first
import { CalculatorBreadcrumb } from "../../../../../src/features/cost-of-living-calculator/shell/calculator-breadcrumb";

afterEach(cleanup);

// Gherkin (binds): "calculator breadcrumb" (escape links, chevron separators, final crumb).
describe("CalculatorBreadcrumb", () => {
  it("3a: renders a <nav> with aria-label='Breadcrumb'", () => {
    localeHolder.value = "en";
    render(<CalculatorBreadcrumb />);
    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeTruthy();
  });

  it("3a: renders a 'Home' link pointing to /en when locale is en", () => {
    localeHolder.value = "en";
    render(<CalculatorBreadcrumb />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink.getAttribute("href")).toBe("/en");
  });

  it("3a: renders a 'Tools' link pointing to /en/tools when locale is en", () => {
    localeHolder.value = "en";
    render(<CalculatorBreadcrumb />);
    const toolsLink = screen.getByRole("link", { name: /tools/i });
    expect(toolsLink.getAttribute("href")).toBe("/en/tools");
  });

  it("DWT-B-003: separates crumbs with ChevronRight icons, never a literal '/'", () => {
    localeHolder.value = "en";
    const { container } = render(<CalculatorBreadcrumb />);
    // Three crumbs (Home, Tools, current) → two chevron <svg> separators.
    expect(container.querySelectorAll("svg").length).toBe(2);
    // No literal slash separator anywhere in the rendered text.
    expect(container.textContent).not.toContain("/");
  });

  it.each(["en", "id"] as const)("UWT-013: final crumb text equals calcTitle (the page H1) in locale %s", (locale) => {
    localeHolder.value = locale;
    render(<CalculatorBreadcrumb />);
    const current = screen.getByText(t(locale, "calcTitle"));
    expect(current.getAttribute("aria-current")).toBe("page");
    // The current crumb is not a link.
    expect(current.closest("a")).toBeNull();
  });
});
