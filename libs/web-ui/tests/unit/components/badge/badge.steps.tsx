import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { Badge } from "../../../../src/components/badge/badge";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/badge/badge.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/badge/badge.feature: A default badge shows its text on the solid hue colour
  Scenario("A default badge shows its text on the solid hue colour", ({ When, Then, And }) => {
    let badge: HTMLElement;

    When('I render a Badge with text "workout"', () => {
      cleanup();
      render(<Badge>workout</Badge>);
      badge = screen.getByText("workout");
    });

    Then('I see text "workout"', () => {
      expect(badge).toBeDefined();
    });

    And("the badge has solid background", () => {
      expect(badge.className).toContain("bg-[var(--hue-color)]");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/badge/badge.feature: An outline badge shows the honey wash and honey border
  Scenario("An outline badge shows the honey wash and honey border", ({ When, Then, And }) => {
    let badge: HTMLElement;

    When('I render a Badge variant "outline" hue "honey"', () => {
      cleanup();
      render(
        <Badge variant="outline" hue="honey">
          chip
        </Badge>,
      );
      badge = screen.getByText("chip");
    });

    Then("the badge has honey wash background", () => {
      expect(badge.style.getPropertyValue("--hue-wash")).toBe("var(--hue-honey-wash)");
    });

    And("the badge has honey border", () => {
      expect(badge.className).toContain("border");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/badge/badge.feature: A secondary badge uses the secondary colour
  Scenario("A secondary badge uses the secondary colour", ({ When, Then }) => {
    let badge: HTMLElement;

    When('I render a Badge variant "secondary"', () => {
      cleanup();
      render(<Badge variant="secondary">sec</Badge>);
      badge = screen.getByText("sec");
    });

    Then("the badge has background color from --color-secondary", () => {
      expect(badge.className).toContain("bg-secondary");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/badge/badge.feature: A destructive badge uses the destructive colour
  Scenario("A destructive badge uses the destructive colour", ({ When, Then }) => {
    let badge: HTMLElement;

    When('I render a Badge variant "destructive"', () => {
      cleanup();
      render(<Badge variant="destructive">err</Badge>);
      badge = screen.getByText("err");
    });

    Then("the badge uses destructive colors", () => {
      expect(badge.className).toContain("bg-destructive");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/badge/badge.feature: An md badge has 13px text and wider padding than sm
  Scenario("An md badge has 13px text and wider padding than sm", ({ When, Then, And }) => {
    let badge: HTMLElement;

    When('I render a Badge with size "md"', () => {
      cleanup();
      render(<Badge size="md">md</Badge>);
      badge = screen.getByText("md");
    });

    Then('the badge has class containing "text-[13px]"', () => {
      expect(badge.className).toContain("text-[13px]");
    });

    And("the badge has wider padding than an sm badge", () => {
      const { container } = render(<Badge size="sm">sm</Badge>);
      const small = container.firstElementChild;
      expect(badge.className).toContain("px-2.5");
      expect(small?.className ?? "").toContain("px-2 ");
      expect(small?.className ?? "").not.toContain("px-2.5");
    });
  });
});
