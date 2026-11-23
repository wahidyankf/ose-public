import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Phase 3 — footer multi-column nav (Learn · Tools · About) matching chrome-1280 mockup
describe("Phase 3 — Footer multi-column nav", () => {
  it("renders Learn / Tools / About column headings (en)", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    render(<Footer locale="en" />);

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("Tools")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
  });

  it("renders localized column headings (id)", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    render(<Footer locale="id" />);

    expect(screen.getByText("Belajar")).toBeTruthy();
    expect(screen.getByText("Alat")).toBeTruthy();
    expect(screen.getByText("Tentang")).toBeTruthy();
  });

  it("Learn column links to /en/browse and Tools column links directly to the calculator", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    render(<Footer locale="en" />);

    const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/browse");
    // EWT-001 fix: footer Tools sub-link points directly to the calculator, not the index
    expect(hrefs).toContain("/en/tools/cost-of-living-calculator");
  });

  it("About column links to the loose About + Terms pages (en)", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    render(<Footer locale="en" />);

    const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/about-ayokoding");
    expect(hrefs).toContain("/en/terms-and-conditions");
  });

  it("About column links to the loose About + Terms pages (id)", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    render(<Footer locale="id" />);

    const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/id/tentang-ayokoding");
    expect(hrefs).toContain("/id/syarat-dan-ketentuan");
  });

  it("keeps the copyright row with the MIT license link", async () => {
    const { Footer } = await import("../../../../../src/features/app-shell/shell/footer");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
    render(<Footer locale="en" />);

    const year = 2026;
    expect(screen.getByText(new RegExp(`${year} AyoKoding`))).toBeTruthy();
    const license = screen.getByRole("link", { name: "MIT" });
    expect(license.getAttribute("href")).toContain("/LICENSE");
  });
});
