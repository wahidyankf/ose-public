import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { ProgressRing } from "../../../../src/components/progress-ring/progress-ring";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/progress-ring/progress-ring.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/progress-ring/progress-ring.feature: The progress ring reports its value as a percentage
  ScenarioOutline("The progress ring reports its value as a percentage", ({ When, Then }, examples) => {
    let progressbar: Element | null = null;

    When("I render a ProgressRing with progress <progress>", () => {
      cleanup();
      progressbar = render(<ProgressRing progress={Number(examples["progress"])} />).container.querySelector(
        "progress",
      );
    });

    Then('the progressbar should have aria-valuenow "<percent>"', () => {
      expect(progressbar?.getAttribute("aria-valuenow")).toBe(String(examples["percent"]));
    });
  });

  // @scenario specs/libs/web-ui/behaviours/progress-ring/progress-ring.feature: Has correct aria attributes
  Scenario("Has correct aria attributes", ({ When, Then, And }) => {
    let progressbar: Element | null;

    When("I render a ProgressRing with progress 0.75", () => {
      cleanup();
      progressbar = render(<ProgressRing progress={0.75} />).container.querySelector("progress");
    });

    Then('the progressbar should have aria-valuemin "0"', () => {
      expect(progressbar?.getAttribute("aria-valuemin")).toBe("0");
    });

    And('the progressbar should have aria-valuemax "100"', () => {
      expect(progressbar?.getAttribute("aria-valuemax")).toBe("100");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/progress-ring/progress-ring.feature: Progress below 0 or above 1 is clamped to 0 or 100
  ScenarioOutline("Progress below 0 or above 1 is clamped to 0 or 100", ({ When, Then }, examples) => {
    let progressbar: Element | null = null;

    When("I render a ProgressRing with progress <progress>", () => {
      cleanup();
      progressbar = render(<ProgressRing progress={Number(examples["progress"])} />).container.querySelector(
        "progress",
      );
    });

    Then('the progressbar should have aria-valuenow "<percent>"', () => {
      expect(progressbar?.getAttribute("aria-valuenow")).toBe(String(examples["percent"]));
    });
  });
});
