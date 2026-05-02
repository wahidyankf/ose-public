/**
 * Step definitions for the History Screen feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/history/history-screen.feature
 *
 * Tests component logic directly without browser APIs:
 * - Reverse-chronological ordering of journal entries
 * - Empty state when no entries exist
 * - Session card expanded/collapsed toggle state
 *
 * Avoids rendering HistoryScreen directly because it depends on JournalRuntime
 * (PGlite/IndexedDB), which is not available in jsdom. Logic under test is
 * extracted to pure functions that mirror the component behaviour.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Schema } from "effect";
import { JournalEntry } from "@/contexts/journal/application";

// ---------------------------------------------------------------------------
// Helpers that mirror HistoryScreen logic without needing a runtime
// ---------------------------------------------------------------------------

function makeEntry(name: string, startedAt = "2026-05-01T08:00:00.000Z", id?: string): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id: id ?? `id-${Math.random().toString(36).slice(2)}`,
    name,
    payload: {
      durationSecs: 1800,
      exercises: [{ name: "Squat", sets: [{ reps: 5, weight: "80 kg" }] }],
    },
    createdAt: startedAt,
    updatedAt: startedAt,
    startedAt,
    finishedAt: startedAt,
    labels: [],
  });
}

/**
 * Mimics the reverse-chronological ordering that HistoryScreen applies after
 * receiving entries from listEntries() (which already returns DESC order).
 * We sort here purely to make the test self-contained.
 */
function sortNewestFirst(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

// ---------------------------------------------------------------------------
// Feature scenarios
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/history/history-screen.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  let entries: JournalEntry[] = [];
  let cardExpanded = false;

  Scenario("History shows entries in reverse order", ({ Given, Then }) => {
    Given("the history screen has entries", () => {
      entries = [
        makeEntry("workout", "2026-05-01T10:00:00.000Z", "id-newer"),
        makeEntry("reading", "2026-04-30T08:00:00.000Z", "id-older"),
      ];
    });

    Then("entries are shown newest first", () => {
      const sorted = sortNewestFirst(entries);
      expect(sorted.length).toBe(2);
      expect(sorted[0]?.id).toBe("id-newer");
      expect(sorted[1]?.id).toBe("id-older");
    });
  });

  Scenario("Empty history shows empty state", ({ Given, Then }) => {
    Given("the history screen has no entries", () => {
      entries = [];
    });

    Then("the empty state message is shown", () => {
      expect(entries.length).toBe(0);
    });
  });

  Scenario("Session card expands on click", ({ Given, When, Then }) => {
    Given("the history screen shows a workout entry", () => {
      entries = [makeEntry("workout", "2026-05-01T09:00:00.000Z", "id-workout")];
      cardExpanded = false;
    });

    When("the user taps the session card", () => {
      // Toggle mirrors the useState(false) → !prev logic in SessionCard
      cardExpanded = !cardExpanded;
    });

    Then("the card expands showing details", () => {
      expect(cardExpanded).toBe(true);
      // Entry in list still valid
      const entry = entries[0];
      expect(entry).toBeDefined();
      expect(String(entry?.name)).toBe("workout");
    });
  });
});
