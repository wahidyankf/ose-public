import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { Icon, ICON_NAMES } from "../../../../src/components/icon/icon";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/icon/icon.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/icon/icon.feature: Known icon renders SVG
  Scenario("Known icon renders SVG", ({ When, Then }) => {
    let svg: SVGSVGElement | null;

    When('I render an Icon with name "check"', () => {
      cleanup();
      svg = render(<Icon name="check" />).container.querySelector("svg");
    });

    Then("the SVG element should be present", () => {
      expect(svg).toBeTruthy();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/icon/icon.feature: Unknown name renders fallback circle
  Scenario("Unknown name renders fallback circle", ({ When, Then }) => {
    let fallback: SVGCircleElement | null;

    When('I render an Icon with name "nonexistent-icon"', () => {
      cleanup();
      fallback = render(<Icon name={"nonexistent-icon" as string} />).container.querySelector("circle");
    });

    Then("the SVG should contain a fallback circle", () => {
      expect(fallback).toBeTruthy();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/icon/icon.feature: Decorative icon has aria-hidden
  Scenario("Decorative icon has aria-hidden", ({ When, Then }) => {
    let svg: SVGSVGElement | null;

    When('I render an Icon with name "home" without aria-label', () => {
      cleanup();
      svg = render(<Icon name="home" />).container.querySelector("svg");
    });

    Then("the icon should have aria-hidden set to true", () => {
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/icon/icon.feature: Icon with aria-label has accessible name
  Scenario("Icon with aria-label has accessible name", ({ When, Then }) => {
    let svg: SVGSVGElement | null;

    When('I render an Icon with name "home" and aria-label "Home"', () => {
      cleanup();
      svg = render(<Icon name="home" aria-label="Home" />).container.querySelector("svg");
    });

    Then('the icon should have role "img" and aria-label "Home"', () => {
      expect(svg?.getAttribute("role")).toBe("img");
      expect(svg?.getAttribute("aria-label")).toBe("Home");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/icon/icon.feature: Every name in IconName draws an icon, not the fallback circle
  Scenario("Every name in IconName draws an icon, not the fallback circle", ({ When, Then }) => {
    let fallbacks: string[] = [];
    let total = 0;

    When("I render an Icon for every name in the IconName set", () => {
      cleanup();
      fallbacks = [];
      total = ICON_NAMES.length;
      for (const name of ICON_NAMES) {
        const { container, unmount } = render(<Icon name={name} />);
        const circle = container.querySelector("circle");
        const pathNodes = container.querySelectorAll("path, line, polyline, polygon, rect, ellipse, circle");
        // The fallback draws exactly one circle and nothing else; a real icon draws its own shapes.
        if (circle !== null && pathNodes.length === 1) fallbacks.push(name);
        unmount();
      }
    });

    Then("each name draws its own icon instead of the fallback circle", () => {
      expect(total).toBeGreaterThan(0);
      expect(fallbacks).toEqual([]);
    });
  });
});
