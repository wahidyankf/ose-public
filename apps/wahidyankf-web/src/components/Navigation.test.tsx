import React from "react";
import { render, screen, within } from "@testing-library/react";
import { Navigation } from "./Navigation";
import { usePathname } from "next/navigation";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the usePathname hook
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("Navigation", () => {
  beforeEach(() => {
    // Reset the mock before each test
    vi.mocked(usePathname).mockReset();
  });

  describe("Mobile Navigation", () => {
    it("renders mobile navigation", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Navigation />);

      const mobileNav = screen.getByTestId("mobile-nav");
      expect(mobileNav).toBeVisible();

      const homeLink = within(mobileNav).getByRole("link", { name: "Home" });
      const cvLink = within(mobileNav).getByRole("link", { name: "CV" });
      const projectsLink = within(mobileNav).getByRole("link", {
        name: "Personal Projects",
      });

      expect(homeLink).toBeDefined();
      expect(cvLink).toBeDefined();
      expect(projectsLink).toBeDefined();
    });

    it("highlights active page in mobile navigation", () => {
      vi.mocked(usePathname).mockReturnValue("/cv");
      render(<Navigation />);

      const mobileNav = screen.getByTestId("mobile-nav");
      const activeLink = within(mobileNav).getByRole("link", { name: "CV" });
      const inactiveLink = within(mobileNav).getByRole("link", {
        name: "Home",
      });

      expect(activeLink.className).toContain("text-yellow-400");
      expect(inactiveLink.className).toContain("text-green-400");
    });
  });

  describe("Desktop Navigation", () => {
    it("renders desktop navigation", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Navigation />);

      const desktopNav = screen.getByTestId("desktop-nav");
      expect(screen.getByText("WahidyanKF")).toBeDefined();

      const homeLink = within(desktopNav).getByRole("link", { name: "Home" });
      const cvLink = within(desktopNav).getByRole("link", { name: "CV" });
      const projectsLink = within(desktopNav).getByRole("link", {
        name: "Personal Projects",
      });

      expect(homeLink).toBeDefined();
      expect(cvLink).toBeDefined();
      expect(projectsLink).toBeDefined();
    });

    it("highlights active page in desktop navigation", () => {
      vi.mocked(usePathname).mockReturnValue("/cv");
      render(<Navigation />);

      const desktopNav = screen.getByTestId("desktop-nav");
      const activeLink = within(desktopNav).getByRole("link", { name: "CV" });
      const inactiveLink = within(desktopNav).getByRole("link", {
        name: "Home",
      });

      expect(activeLink.className).toContain("text-yellow-400");
      expect(inactiveLink.className).toContain("text-green-400");
    });
  });
});
