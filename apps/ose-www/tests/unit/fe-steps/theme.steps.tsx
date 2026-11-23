import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React, { useState } from "react";

const { observedTheme, themeObserver } = vi.hoisted(() => {
  const theme = { selected: "light" };
  const observer = { update: (_theme: string) => {} };
  return { observedTheme: theme, themeObserver: observer };
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

// The reload scenario uses the real next-themes provider, so the storage it writes is the library's own.
// next-themes reads matchMedia on mount even with system detection off, and jsdom does not provide it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
const actualThemes = await vi.importActual<typeof import("next-themes")>("next-themes");

function PersistenceHarness() {
  const { setTheme } = actualThemes.useTheme();
  return <button onClick={() => setTheme("dark")}>Dark</button>;
}

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.className = "";
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

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: The chosen theme is kept when the visitor reloads the page
  Scenario("The chosen theme is kept when the visitor reloads the page", ({ Given, When, And, Then }) => {
    const themedPage = (
      <actualThemes.ThemeProvider attribute="class" defaultTheme={DEFAULT_THEME} enableSystem={false}>
        <PersistenceHarness />
      </actualThemes.ThemeProvider>
    );

    Given("the site is in light mode", () => {
      render(themedPage);
      expect(document.documentElement).not.toHaveClass("dark");
    });

    When("the user clicks the theme toggle and selects dark mode", () => {
      fireEvent.click(screen.getByRole("button", { name: "Dark" }));
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    And("the visitor reloads the page", () => {
      cleanup();
      document.documentElement.classList.remove("dark");
      render(themedPage);
    });

    Then("the site switches to dark mode", () => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });
});
