import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

import { SideNav } from "../../../../src/components/side-nav/side-nav";
import type { TabItem } from "../../../../src/components/tab-bar/tab-bar";

const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "history" },
];

const brand = { name: "OrganicLever", icon: "dumbbell", hue: "teal" as const };

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/side-nav/side-nav.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/side-nav/side-nav.feature: The side nav shows its brand and every tab
  Scenario("The side nav shows its brand and every tab", ({ When, Then, And }) => {
    let brandName: HTMLElement;
    let homeTab: HTMLElement;
    let historyTab: HTMLElement;

    When('I render a SideNav with brand "OrganicLever" and tabs', () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="home" onChange={vi.fn()} />);
      brandName = screen.getByText("OrganicLever");
      homeTab = screen.getByText("Home");
      historyTab = screen.getByText("History");
    });

    Then('the text "OrganicLever" should be visible', () => {
      expect(brandName.textContent).toBe("OrganicLever");
    });

    And('the tab "Home" should be visible', () => {
      expect(homeTab.textContent).toBe("Home");
    });

    And('the tab "History" should be visible', () => {
      expect(historyTab.textContent).toBe("History");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/side-nav/side-nav.feature: Tab click triggers onChange with tab id
  Scenario("Tab click triggers onChange with tab id", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given('I render a SideNav with brand "OrganicLever" and tabs', () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="home" onChange={onChangeMock} />);
      expect(screen.getByText("History")).toBeDefined();
    });

    When('the user clicks the "History" tab', () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="home" onChange={onChangeMock} />);
      fireEvent.click(screen.getByText("History"));
    });

    Then('onChange should be called with "history"', () => {
      expect(onChangeMock).toHaveBeenCalledWith("history");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/side-nav/side-nav.feature: The current tab is marked as current
  Scenario("The current tab is marked as current", ({ When, Then, And }) => {
    let homeButton: HTMLButtonElement | null;
    let historyButton: HTMLButtonElement | null;

    When('I render a SideNav with brand "OrganicLever" current "home" and tabs', () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="home" onChange={vi.fn()} />);
      homeButton = screen.getByText("Home").closest("button");
      historyButton = screen.getByText("History").closest("button");
    });

    Then('the "Home" tab should be marked as current', () => {
      expect(homeButton?.getAttribute("aria-current")).toBe("page");
    });

    And('the "History" tab should not be marked as current', () => {
      expect(historyButton?.hasAttribute("aria-current")).toBe(false);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/side-nav/side-nav.feature: Brand row click always calls onChange with home
  Scenario("Brand row click always calls onChange with home", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given('I render a SideNav with brand "OrganicLever" current "history" and tabs', () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="history" onChange={onChangeMock} />);
      expect(screen.getByText("OrganicLever")).toBeDefined();
    });

    When("the user clicks the brand row", () => {
      cleanup();
      render(<SideNav brand={brand} tabs={tabs} current="history" onChange={onChangeMock} />);
      fireEvent.click(screen.getByText("OrganicLever"));
    });

    Then('onChange should be called with "home"', () => {
      expect(onChangeMock).toHaveBeenCalledWith("home");
    });
  });
});
