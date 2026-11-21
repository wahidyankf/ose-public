import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React, { useState } from "react";

const { observedTheme, themeObserver } = vi.hoisted(() => {
  const observedTheme = { selected: "light" };
  const themeObserver = { update: (_theme: string) => {} };
  return { observedTheme, themeObserver };
});

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Moon: () => <svg data-testid="moon-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
}));

// Mock @open-sharia-enterprise/web-ui
vi.mock("@open-sharia-enterprise/web-ui", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return <button {...props}>{children}</button>;
  },
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: (theme: string) => {
      observedTheme.selected = theme;
      themeObserver.update(theme);
    },
    resolvedTheme: "light",
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { DEFAULT_THEME } from "@/app/layout";
import { ThemeToggle } from "@/features/app-shell/shell/theme-toggle";

function ThemeHarness() {
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME);
  themeObserver.update = setSelectedTheme;
  return (
    <>
      <output data-testid="selected-theme">{selectedTheme}</output>
      <ThemeToggle />
    </>
  );
}

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(ThemeToggle).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: Default theme is light mode
  Scenario("Default theme is light mode", ({ When, Then }) => {
    When("the site loads without a stored theme preference", () => {
      render(<ThemeHarness />);
    });

    Then("the theme is set to light mode", () => {
      expect(DEFAULT_THEME).toBe("light");
      expect(screen.getByTestId("selected-theme")).toHaveTextContent("light");
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: Theme toggle switches between modes
  Scenario("Theme toggle switches between modes", ({ Given, When, Then }) => {
    Given("the site is in light mode", () => {
      render(<ThemeHarness />);
      expect(DEFAULT_THEME).toBe("light");
    });

    When("the user clicks the theme toggle and selects dark mode", () => {
      const darkMenuItem = screen.getByRole("menuitem", { name: /Dark/i });
      fireEvent.click(darkMenuItem);
      expect(observedTheme.selected).toBe("dark");
    });

    Then("the site switches to dark mode", () => {
      expect(observedTheme.selected).toBe("dark");
    });
  });
});
