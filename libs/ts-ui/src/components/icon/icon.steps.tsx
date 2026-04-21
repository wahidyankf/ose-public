import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { Icon } from "./icon";

const feature = await loadFeature(path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/icon/icon.feature"));

describeFeature(feature, ({ Scenario }) => {
  Scenario("Known icon renders SVG", ({ Given, Then }) => {
    Given('I render an Icon with name "check"', () => {
      // precondition noted
    });

    Then("the SVG element should be present", () => {
      cleanup();
      const { container } = render(<Icon name="check" />);
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  Scenario("Unknown name renders fallback circle", ({ Given, Then }) => {
    Given('I render an Icon with name "nonexistent-icon"', () => {
      // precondition noted
    });

    Then("the SVG should contain a fallback circle", () => {
      cleanup();
      const { container } = render(<Icon name={"nonexistent-icon" as string} />);
      expect(container.querySelector("circle")).toBeTruthy();
    });
  });

  Scenario("Decorative icon has aria-hidden", ({ Given, Then }) => {
    Given('I render an Icon with name "home" without aria-label', () => {
      // precondition noted
    });

    Then("the icon should have aria-hidden set to true", () => {
      cleanup();
      const { container } = render(<Icon name="home" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  Scenario("Icon with aria-label has accessible name", ({ Given, Then }) => {
    Given('I render an Icon with name "home" and aria-label "Home"', () => {
      // precondition noted
    });

    Then('the icon should have role "img" and aria-label "Home"', () => {
      cleanup();
      const { container } = render(<Icon name="home" aria-label="Home" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("role")).toBe("img");
      expect(svg?.getAttribute("aria-label")).toBe("Home");
    });
  });
});
