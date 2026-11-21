import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { JournalRuntime } from "@/contexts/journal/application";
import type { Routine } from "@/contexts/routine/application";
import { EditRoutineScreen } from "@/contexts/routine/presentation/components/edit-routine-screen";

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature",
  ),
);

const existingRoutine: Routine = {
  id: "routine-1",
  name: "Push Day",
  hue: "teal",
  type: "workout",
  createdAt: "2026-01-01T00:00:00.000Z",
  groups: [{ id: "group-1", name: "Main", exercises: [] }],
};

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  let runPromise: ReturnType<typeof vi.fn>;
  let onSave = vi.fn<() => void>();
  let onBack = vi.fn<() => void>();
  let runtime: JournalRuntime;

  AfterEachScenario(() => cleanup());

  function renderEditor(routine: Routine | null) {
    runPromise = vi.fn().mockResolvedValue(undefined);
    onSave = vi.fn();
    onBack = vi.fn();
    runtime = { runPromise } as unknown as JournalRuntime;
    render(<EditRoutineScreen routine={routine} runtime={runtime} onSave={onSave} onBack={onBack} />);
  }

  // @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Create a new routine
  Scenario("Create a new routine", ({ Given, When, And, Then }) => {
    Given("the edit routine screen is open for a new routine", () => renderEditor(null));
    When("the user enters a routine name", () => {
      fireEvent.change(screen.getByLabelText("Routine name"), { target: { value: "Morning Strength" } });
    });
    And("the user saves the routine", () => {
      fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    });
    Then("the routine is saved", async () => {
      await waitFor(() => expect(runPromise).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Add an exercise to a routine
  Scenario("Add an exercise to a routine", ({ Given, When, Then }) => {
    Given("the edit routine screen is open", () => renderEditor(null));
    When("the user adds an exercise", () => {
      fireEvent.click(screen.getByRole("button", { name: "Add exercise to Main" }));
    });
    Then("the exercise appears in the group", () => {
      expect(screen.getByText("Unnamed exercise")).toBeVisible();
      expect(screen.getByRole("button", { name: "Expand exercise" })).toBeVisible();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Delete a routine
  Scenario("Delete a routine", ({ Given, When, Then }) => {
    Given("the edit routine screen is open for an existing routine", () => renderEditor(existingRoutine));
    When("the user confirms deleting the routine", () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete routine" }));
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    });
    Then("the routine is deleted", async () => {
      await waitFor(() => expect(runPromise).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    });
  });
});
