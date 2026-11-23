import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { Schema } from "effect";
import { JournalEntry, type JournalRuntime } from "@/contexts/journal/application";
import { HomeScreen } from "@/contexts/app-shell/presentation/components/home/home-screen";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature"),
);

function makeEntry(name: string, id: string, title: string, startedAt: string): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id,
    name,
    payload: name === "reading" ? { title, author: "Test Author" } : { task: title },
    createdAt: startedAt,
    updatedAt: startedAt,
    startedAt,
    finishedAt: startedAt,
    labels: [],
  });
}

const workout = makeEntry("workout", "workout-1", "Strength", "2026-05-01T10:00:00.000Z");
const reading = makeEntry("reading", "reading-1", "Atomic Habits", "2026-05-01T09:00:00.000Z");

function renderHome(entries: ReadonlyArray<JournalEntry>) {
  const runtime = {
    runPromise: vi
      .fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ workoutsThisWeek: 0, streak: 0, totalMins: 0, totalSets: 0 })
      .mockResolvedValueOnce(entries)
      .mockResolvedValueOnce([]),
  } as unknown as JournalRuntime;
  render(
    <HomeScreen
      runtime={runtime}
      onStartWorkout={vi.fn<(...args: unknown[]) => unknown>()}
      onEditRoutine={vi.fn<(...args: unknown[]) => unknown>()}
    />,
  );
  return runtime;
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => cleanup());

  // @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Home screen shows entry list
  Scenario("Home screen shows entry list", ({ When, Then }) => {
    When("the home screen is loaded with entries", async () => {
      renderHome([reading]);
      await screen.findByText("Atomic Habits");
    });
    Then("the entry list is visible", () => {
      expect(screen.getByText("Recent entries")).toBeVisible();
      expect(screen.getByText("Atomic Habits")).toBeVisible();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Filter entries by kind
  Scenario("Filter entries by kind", ({ Given, When, Then }) => {
    Given("the home screen is loaded with workout and reading entries", async () => {
      renderHome([workout, reading]);
      await screen.findByText("Atomic Habits");
    });
    When("the user selects the Workout filter", () => {
      fireEvent.click(screen.getByRole("button", { name: "Workout" }));
    });
    Then("only workout entries are shown", async () => {
      await waitFor(() => expect(screen.queryByText("Atomic Habits")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Workout" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Workout templates")).toBeVisible();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Tapping an entry opens its detail sheet
  Scenario("Tapping an entry opens its detail sheet", ({ Given, When, Then }) => {
    Given("the home screen shows an entry", async () => {
      renderHome([reading]);
      await screen.findByText("Atomic Habits");
    });
    When("the user taps the entry", () => {
      fireEvent.click(screen.getByText("Atomic Habits"));
    });
    Then("the entry detail sheet opens", () => {
      expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
      expect(screen.getAllByText("Atomic Habits").length).toBeGreaterThan(1);
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Closing the detail sheet returns to the entry list
  Scenario("Closing the detail sheet returns to the entry list", ({ Given, When, Then }) => {
    Given("the entry detail sheet is open", async () => {
      renderHome([reading]);
      await screen.findByText("Atomic Habits");
      fireEvent.click(screen.getByText("Atomic Habits"));
      await screen.findByRole("button", { name: "Close" });
    });
    When("the user closes the sheet", () => {
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
    });
    Then("the entry list is visible", () => {
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
      expect(screen.getByText("Recent entries")).toBeVisible();
    });
  });
});
