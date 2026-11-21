import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { StatCard } from "../../../../src/components/stat-card/stat-card";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/stat-card/stat-card.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/stat-card/stat-card.feature: Renders label and value
  Scenario("Renders label and value", ({ When, Then, And }) => {
    let renderedText = "";

    When('I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend"', () => {
      cleanup();
      const { container } = render(<StatCard label="Steps" value="12500" unit="steps" hue="teal" icon="trend" />);
      renderedText = container.textContent ?? "";
    });

    Then('the text "Steps" should be visible', () => {
      expect(renderedText).toContain("Steps");
    });

    And('the text "12500" should be visible', () => {
      expect(renderedText).toContain("12500");
    });

    And('the text "steps" should be visible', () => {
      expect(renderedText).toContain("steps");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/stat-card/stat-card.feature: A stat card shows an info tip only when it has info
  ScenarioOutline("A stat card shows an info tip only when it has info", ({ When, Then }, examples) => {
    const withInfo = String(examples["info"] ?? "").startsWith("and info");
    let infoTipFound = false;

    When('I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend" <info>', () => {
      cleanup();
      render(
        withInfo ? (
          <StatCard label="Steps" value="12500" unit="steps" hue="teal" icon="trend" info="Daily step count" />
        ) : (
          <StatCard label="Steps" value="12500" unit="steps" hue="teal" icon="trend" />
        ),
      );
      infoTipFound = screen.queryByRole("button", { name: "Steps" }) !== null;
    });

    Then("the InfoTip trigger should be <presence>", () => {
      expect(infoTipFound).toBe(examples["presence"] === "visible");
    });
  });
});
