// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/features/app-shell/shell/footer";
import { Header } from "@/features/app-shell/shell/header";
import { MobileNav } from "@/features/app-shell/shell/mobile-nav";
import { ThemeToggle } from "@/features/app-shell/shell/theme-toggle";
import { SearchContext } from "@/features/search/shell/use-search";

const setTheme = vi.hoisted(() => vi.fn<(theme: string) => void>());

// next/link rewrites trailing slashes according to the Next config, which this unit run does not load.
// The anchor it renders is the contract under test, so the double renders the href exactly as written.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode; [key: string]: unknown }) =>
      createElement("a", { href, ...rest }, children),
  };
});

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme, resolvedTheme: "light" }),
}));

afterEach(cleanup);

describe("Footer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-01T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the current year, the licence, and the sister site", () => {
    render(<Footer />);

    expect(screen.getByText(/© 2026 Open Sharia Enterprise Platform/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MIT" })).toHaveAttribute(
      "href",
      "https://github.com/wahidyankf/ose-public/blob/main/LICENSE",
    );
    expect(screen.getByRole("link", { name: "AyoKoding" })).toHaveAttribute("href", "https://www.ayokoding.com");
  });
});

describe("MobileNav", () => {
  it("shows no menu while closed", () => {
    render(<MobileNav open={false} onOpenChange={vi.fn<(open: boolean) => void>()} />);

    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  });

  it("lists the site links, and closes itself when one is followed", () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<MobileNav open onOpenChange={onOpenChange} />);

    const menu = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(menu).getByRole("link", { name: "Updates" })).toHaveAttribute("href", "/updates/");
    expect(within(menu).getByRole("link", { name: "GitHub" })).toHaveAttribute("target", "_blank");

    fireEvent.click(within(menu).getByRole("link", { name: "About" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("ThemeToggle", () => {
  it("sets the theme the visitor picks from the menu", () => {
    render(<ThemeToggle />);

    const trigger = screen.getByRole("button", { name: "Toggle theme" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Dark" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});

function renderHeader(setOpen = vi.fn<(open: boolean) => void>()) {
  render(
    <SearchContext.Provider value={{ open: false, setOpen }}>
      <Header />
    </SearchContext.Provider>,
  );
  return setOpen;
}

describe("Header", () => {
  it("links the brand and the main sections, marking external links as new-tab", () => {
    renderHeader();

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(screen.getByRole("link", { name: "OSE Platform" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Updates" })).toHaveAttribute("href", "/updates/");
    expect(within(nav).getByRole("link", { name: "Documentation" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("opens search from either search button", () => {
    const setOpen = renderHeader();

    for (const button of screen.getAllByRole("button", { name: "Search" })) {
      fireEvent.click(button);
    }

    expect(setOpen).toHaveBeenCalledTimes(2);
    expect(setOpen).toHaveBeenLastCalledWith(true);
  });

  it("opens the mobile navigation from the menu button", () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
  });
});
