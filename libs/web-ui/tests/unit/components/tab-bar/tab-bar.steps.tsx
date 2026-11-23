import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

import { TabBar, type TabItem } from "../../../../src/components/tab-bar/tab-bar";

const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "history" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/tab-bar/tab-bar.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/tab-bar/tab-bar.feature: Renders tabs
  Scenario("Renders tabs", ({ When, Then }) => {
    let renderedTabs: HTMLElement[];

    When('I render a TabBar with tabs "Home,History,Settings" and current "Home"', () => {
      cleanup();
      render(<TabBar tabs={tabs} current="home" onChange={vi.fn()} />);
      renderedTabs = screen.getAllByRole("tab");
    });

    Then("the tab bar should show 3 tabs", () => {
      expect(renderedTabs).toHaveLength(3);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/tab-bar/tab-bar.feature: Click triggers onChange
  Scenario("Click triggers onChange", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given('I render a TabBar with tabs "Home,History,Settings" and current "Home"', () => {
      cleanup();
      render(<TabBar tabs={tabs} current="home" onChange={onChangeMock} />);
      expect(screen.getByRole("tab", { name: /history/i })).toBeDefined();
    });

    When('the user clicks the "History" tab', () => {
      cleanup();
      render(<TabBar tabs={tabs} current="home" onChange={onChangeMock} />);
      fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    });

    Then('onChange should be called with "history"', () => {
      expect(onChangeMock).toHaveBeenCalledWith("history");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/tab-bar/tab-bar.feature: Each tab reports whether it is the selected tab
  ScenarioOutline("Each tab reports whether it is the selected tab", ({ When, Then }, examples) => {
    const tabName = String(examples["tab"] ?? "");
    let selectedValue: string | null = null;

    When('I render a TabBar with tabs "Home,History,Settings" and current "home"', () => {
      cleanup();
      render(<TabBar tabs={tabs} current="home" onChange={vi.fn()} />);
      selectedValue = screen.getByRole("tab", { name: new RegExp(tabName, "i") }).getAttribute("aria-selected");
    });

    Then('the "<tab>" tab should have aria-selected "<selected>"', () => {
      expect(selectedValue).toBe(String(examples["selected"]));
    });
  });
});
