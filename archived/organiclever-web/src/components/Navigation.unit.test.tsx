import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => React.createElement("a", { href, className, onClick }, children),
}));

import { Navigation } from "./Navigation";

describe("Navigation", () => {
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders expanded navigation with labels by default", () => {
    render(<Navigation logout={mockLogout} />);
    expect(screen.getByText("Organic Lever")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Team")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
  });

  it("opens mobile overlay when hamburger button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navigation logout={mockLogout} />);

    expect(container.querySelector(".bg-opacity-50")).toBeNull();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);

    expect(container.querySelector(".bg-opacity-50")).not.toBeNull();
  });

  it("closes mobile overlay when overlay is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navigation logout={mockLogout} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);

    const overlay = container.querySelector(".bg-opacity-50");
    expect(overlay).not.toBeNull();

    await user.click(overlay!);

    expect(container.querySelector(".bg-opacity-50")).toBeNull();
  });

  it("collapses sidebar when collapse button is clicked", async () => {
    const user = userEvent.setup();
    render(<Navigation logout={mockLogout} />);

    expect(screen.getByText("Organic Lever")).toBeTruthy();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]!);

    expect(screen.queryByText("Organic Lever")).toBeNull();
    expect(screen.queryByText("Team")).toBeNull();
    expect(screen.queryByText("Logout")).toBeNull();
    expect(localStorage.getItem("sidebarCollapsed")).toBe("true");
  });

  it("expands sidebar when collapse button is clicked while collapsed", async () => {
    const user = userEvent.setup();
    localStorage.setItem("sidebarCollapsed", "true");
    render(<Navigation logout={mockLogout} />);

    expect(screen.queryByText("Organic Lever")).toBeNull();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]!);

    expect(screen.getByText("Organic Lever")).toBeTruthy();
    expect(localStorage.getItem("sidebarCollapsed")).toBe("false");
  });

  it("initializes in collapsed state from localStorage saved=true", () => {
    localStorage.setItem("sidebarCollapsed", "true");
    render(<Navigation logout={mockLogout} />);

    expect(screen.queryByText("Organic Lever")).toBeNull();
    expect(screen.queryByText("Team")).toBeNull();
    expect(screen.queryByText("Logout")).toBeNull();
  });

  it("initializes in expanded state from localStorage saved=false", () => {
    localStorage.setItem("sidebarCollapsed", "false");
    render(<Navigation logout={mockLogout} />);

    expect(screen.getByText("Organic Lever")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
  });

  it("closes mobile menu when a nav link is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navigation logout={mockLogout} />);

    // Open mobile menu
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]!);
    expect(container.querySelector(".bg-opacity-50")).not.toBeNull();

    // Click a nav link — triggers onClick={() => setIsOpen(false)}
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    await user.click(dashboardLink);

    expect(container.querySelector(".bg-opacity-50")).toBeNull();
  });

  it("initializes in expanded state when localStorage returns null — covers saved=null false branch", () => {
    // localStorage is cleared in beforeEach, so getItem returns null
    // The initializer: saved ? JSON.parse(saved) : false → returns false (not collapsed)
    render(<Navigation logout={mockLogout} />);
    expect(screen.getByText("Organic Lever")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Team")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
  });
});
