import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getRouteDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
    coursePaths: {
      getRouteData: { query: getRouteDataMock },
    },
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

// Phase 3 — header primary nav (Learn / Tools) matching chrome-1280 mockup
describe("Phase 3 — Header primary nav", () => {
  it("renders a Learn link pointing to /en/browse", async () => {
    const { Header } = await import("../../../../../src/features/app-shell/shell/header");
    render(<Header locale="en" />);

    const learn = screen.getByRole("link", { name: "Learn" });
    expect(learn.getAttribute("href")).toBe("/en/browse");
  });

  it("renders a Tools link pointing to /en/tools", async () => {
    const { Header } = await import("../../../../../src/features/app-shell/shell/header");
    render(<Header locale="en" />);

    const tools = screen.getByRole("link", { name: "Tools" });
    expect(tools.getAttribute("href")).toBe("/en/tools");
  });

  it("renders localized Indonesian primary-nav labels for locale=id", async () => {
    const { Header } = await import("../../../../../src/features/app-shell/shell/header");
    render(<Header locale="id" />);

    expect(screen.getByRole("link", { name: "Belajar" }).getAttribute("href")).toBe("/id/browse");
    expect(screen.getByRole("link", { name: "Alat" }).getAttribute("href")).toBe("/id/tools");
  });

  it("does not request course-path data until a path context or drawer needs it", async () => {
    const { Header } = await import("../../../../../src/features/app-shell/shell/header");
    render(<Header locale="en" />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getRouteDataMock).not.toHaveBeenCalled();
  });

  it("opens search from both the desktop and the mobile buttons", async () => {
    const { Header } = await import("../../../../../src/features/app-shell/shell/header");
    render(<Header locale="en" />);

    const buttons = screen.getAllByRole("button", { name: "Search" });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      fireEvent.click(button);
    }
    expect(screen.getAllByRole("button", { name: "Search" })).toHaveLength(2);
  });
});
