/**
 * Unit tests for the link-based TabBar.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

let mockPathname = "/app/home";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Stub Next.js Link to a plain anchor so the JSX renders synchronously.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { TabBar } from "./tab-bar";

afterEach(() => {
  cleanup();
  mockPathname = "/app/home";
});

describe("TabBar", () => {
  it("renders four anchor tabs with correct hrefs", () => {
    render(<TabBar onFabPress={vi.fn()} />);
    expect(screen.getByText("Home").closest("a")?.getAttribute("href")).toBe("/app/home");
    expect(screen.getByText("History").closest("a")?.getAttribute("href")).toBe("/app/history");
    expect(screen.getByText("Progress").closest("a")?.getAttribute("href")).toBe("/app/progress");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/app/settings");
  });

  it("marks the current tab active via aria-current=page", () => {
    mockPathname = "/app/history";
    render(<TabBar onFabPress={vi.fn()} />);
    const historyLink = screen.getByText("History").closest("a");
    expect(historyLink?.getAttribute("aria-current")).toBe("page");
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.getAttribute("aria-current")).toBeNull();
  });

  it("calls onFabPress when the centre FAB is clicked", () => {
    const onFabPress = vi.fn();
    render(<TabBar onFabPress={onFabPress} />);
    fireEvent.click(screen.getByLabelText("Log entry"));
    expect(onFabPress).toHaveBeenCalledTimes(1);
  });
});
