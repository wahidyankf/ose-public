import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import { Schema } from "effect";
import { JournalEntry, type JournalRuntime } from "@/contexts/journal/application";
import { HistoryScreen } from "@/contexts/stats/presentation";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature"),
);

function makeEntry(id: string, name: string, title: string, startedAt: string): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id,
    name,
    payload:
      name === "workout"
        ? { routineName: title, durationSecs: 1800, exercises: [{ name: "Squat", sets: [{ reps: 5 }] }] }
        : { title },
    createdAt: startedAt,
    updatedAt: startedAt,
    startedAt,
    finishedAt: startedAt,
    labels: [],
  });
}

const newer = makeEntry("newer", "workout", "Kettlebell day", "2026-05-02T08:00:00.000Z");
const older = makeEntry("older", "reading", "Atomic Habits", "2026-05-01T08:00:00.000Z");

function renderHistory(entries: ReadonlyArray<JournalEntry>) {
  const runtime = {
    runPromise: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(entries),
  } as unknown as JournalRuntime;
  render(<HistoryScreen runtime={runtime} />);
}

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => cleanup());

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: History shows entries in reverse order
  Scenario("History shows entries in reverse order", ({ When, Then }) => {
    When("the history screen has entries", async () => {
      renderHistory([newer, older]);
      await screen.findByText("Kettlebell day");
    });
    Then("entries are shown newest first", () => {
      const text = screen.getAllByRole("button").map((button) => button.textContent ?? "");
      expect(text.findIndex((value) => value.includes("Kettlebell day"))).toBeLessThan(
        text.findIndex((value) => value.includes("Atomic Habits")),
      );
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: Empty history shows empty state
  Scenario("Empty history shows empty state", ({ When, Then }) => {
    When("the history screen has no entries", async () => {
      renderHistory([]);
      await screen.findByText("No sessions yet.");
    });
    Then("the empty state message is shown", () => expect(screen.getByText("No sessions yet.")).toBeVisible());
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: Session card expands on click
  Scenario("Session card expands on click", ({ Given, When, Then }) => {
    Given("the history screen shows a workout entry", async () => {
      renderHistory([newer]);
      await screen.findByText("Kettlebell day");
    });
    When("the user taps the session card", () => {
      fireEvent.click(screen.getByRole("button", { name: /Kettlebell day/i }));
    });
    Then("the card expands showing details", () => {
      expect(screen.getByText("Squat")).toBeVisible();
      expect(screen.getByText("5 reps")).toBeVisible();
    });
  });
});
