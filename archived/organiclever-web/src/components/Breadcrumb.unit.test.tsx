import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

import { usePathname } from "next/navigation";
import Breadcrumb from "./Breadcrumb";

describe("Breadcrumb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null when pathname is null — regression for split-on-null crash", () => {
    vi.mocked(usePathname).mockReturnValue(null as unknown as string);
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nav element with Dashboard link at root", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    const { container } = render(<Breadcrumb />);
    expect(container.querySelector("nav")).not.toBeNull();
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("renders capitalized segment for /dashboard/members", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard/members");
    render(<Breadcrumb />);
    expect(screen.getByText("Members")).toBeTruthy();
  });

  it("renders all segments for deep path /dashboard/members/profile", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard/members/profile");
    render(<Breadcrumb />);
    expect(screen.getByText("Members")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
  });

  it("capitalizes all breadcrumb segment labels", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard/settings");
    render(<Breadcrumb />);
    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.queryByText("settings")).toBeNull();
  });
});
