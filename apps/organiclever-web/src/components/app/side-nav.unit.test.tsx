/**
 * Unit tests for the link-based SideNav (desktop).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

let mockPathname = "/app/home";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

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
import { SideNav } from "./side-nav";

afterEach(() => {
  cleanup();
  mockPathname = "/app/home";
});

describe("SideNav", () => {
  it("renders four nav items with correct hrefs", () => {
    render(<SideNav onLogEntry={vi.fn()} />);
    expect(screen.getByText("Home").closest("a")?.getAttribute("href")).toBe("/app/home");
    expect(screen.getByText("History").closest("a")?.getAttribute("href")).toBe("/app/history");
    expect(screen.getByText("Progress").closest("a")?.getAttribute("href")).toBe("/app/progress");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/app/settings");
  });

  it("marks the current pathname item with aria-current=page", () => {
    mockPathname = "/app/progress";
    render(<SideNav onLogEntry={vi.fn()} />);
    const progressLink = screen.getByText("Progress").closest("a");
    expect(progressLink?.getAttribute("aria-current")).toBe("page");
  });

  it("calls onLogEntry when the Log entry button is clicked", () => {
    const onLogEntry = vi.fn();
    render(<SideNav onLogEntry={onLogEntry} />);
    fireEvent.click(screen.getByText("Log entry"));
    expect(onLogEntry).toHaveBeenCalledTimes(1);
  });
});
