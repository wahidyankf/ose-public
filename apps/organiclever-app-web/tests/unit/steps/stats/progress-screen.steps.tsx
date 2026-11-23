import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { JournalRuntime } from "@/contexts/journal/application";
import { ProgressScreen } from "@/contexts/stats/presentation";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature"),
);

const progress = {
  Squat: {
    routineName: "Kettlebell",
    points: [
      { date: "2026-05-01", weight: 20, reps: 8, estimated1RM: 25.4, isPR: true },
      { date: "2026-05-03", weight: 22, reps: 8, estimated1RM: 27.9, isPR: true },
    ],
  },
};

function renderProgress() {
  const runtime = {
    runPromise: vi
      .fn()
      .mockResolvedValueOnce(progress)
      .mockResolvedValueOnce([{ date: new Date("2026-05-01"), label: "Thu", sessions: 1 }]),
  } as unknown as JournalRuntime;
  render(<ProgressScreen runtime={runtime} />);
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => cleanup());

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Progress screen shows workout module by default
  Scenario("Progress screen shows workout module by default", ({ When, Then }) => {
    When("the progress screen is loaded", () => renderProgress());
    Then("the workout module is active", () => {
      expect(screen.getByRole("button", { name: "Workout" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Switch to reading module
  Scenario("Switch to reading module", ({ Given, When, Then }) => {
    Given("the progress screen is loaded", () => renderProgress());
    When("the user selects the Reading module", () => {
      fireEvent.click(screen.getByRole("button", { name: "Reading" }));
    });
    Then("the reading module content is shown", async () => {
      expect(screen.getByRole("button", { name: "Reading" })).toHaveAttribute("aria-pressed", "true");
      expect(await screen.findByText("1 total")).toBeVisible();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Tapping an exercise card shows its progress chart
  Scenario("Tapping an exercise card shows its progress chart", ({ Given, When, Then }) => {
    Given("there is exercise progress data", async () => {
      renderProgress();
      await screen.findByRole("button", { name: "Squat progress" });
    });
    When("the user taps an exercise card", () => {
      fireEvent.click(screen.getByRole("button", { name: "Squat progress" }));
    });
    Then("the progress chart is visible", () => {
      expect(screen.getByLabelText("Weight progression chart for Squat")).toBeVisible();
    });
  });
});
