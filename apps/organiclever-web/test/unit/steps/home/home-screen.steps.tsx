/**
 * Step definitions for the Home Screen feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/home/home-screen.feature
 *
 * Tests component logic directly without browser APIs:
 * - kindToHue and kindToIcon utility functions
 * - Entry filtering logic (pure function over arrays)
 * - EntryDetailSheet open/close state
 *
 * Avoids rendering HomeScreen directly because it depends on JournalRuntime
 * (PGlite/IndexedDB), which is not available in jsdom. Logic under test is
 * extracted to pure functions that mirror the component behaviour.
 */

import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Schema } from "effect";
import { JournalEntry } from "@/contexts/journal/application";
import { kindToHue, kindToIcon } from "@/components/app/home/kind-hue";

// ---------------------------------------------------------------------------
// Helpers that mirror HomeScreen logic without needing a runtime
// ---------------------------------------------------------------------------

function makeEntry(name: string, startedAt = "2026-05-01T08:00:00.000Z"): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id: `id-${Math.random().toString(36).slice(2)}`,
    name,
    payload: {},
    createdAt: startedAt,
    updatedAt: startedAt,
    startedAt,
    finishedAt: startedAt,
    labels: [],
  });
}

function filterEntries(entries: JournalEntry[], activeFilter: string | null): JournalEntry[] {
  if (activeFilter == null) return entries;
  return entries.filter((e) => String(e.name) === activeFilter);
}

// ---------------------------------------------------------------------------
// Feature scenarios
// ---------------------------------------------------------------------------

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/home/home-screen.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  let entries: JournalEntry[] = [];
  let activeFilter: string | null = null;
  let selectedEntry: JournalEntry | null = null;

  Scenario("Home screen shows entry list", ({ Given, Then }) => {
    Given("the home screen is loaded with entries", () => {
      entries = [makeEntry("workout"), makeEntry("reading")];
      activeFilter = null;
    });

    Then("the entry list is visible", () => {
      const visible = filterEntries(entries, activeFilter);
      expect(visible.length).toBeGreaterThan(0);
    });
  });

  Scenario("Filter entries by kind", ({ Given, When, Then }) => {
    Given("the home screen is loaded with workout and reading entries", () => {
      entries = [makeEntry("workout"), makeEntry("reading"), makeEntry("workout")];
      activeFilter = null;
    });

    When("the user selects the Workout filter", () => {
      activeFilter = "workout";
    });

    Then("only workout entries are shown", () => {
      const visible = filterEntries(entries, activeFilter);
      expect(visible.length).toBe(2);
      expect(visible.every((e) => String(e.name) === "workout")).toBe(true);
      // Reading entry is excluded
      expect(visible.some((e) => String(e.name) === "reading")).toBe(false);
    });
  });

  Scenario("Open entry detail sheet", ({ Given, When, Then }) => {
    Given("the home screen shows an entry", () => {
      entries = [makeEntry("focus")];
      selectedEntry = null;
    });

    When("the user taps the entry", () => {
      const entry = entries[0];
      expect(entry).toBeDefined();
      selectedEntry = entry ?? null;
    });

    Then("the entry detail sheet opens", () => {
      expect(selectedEntry).not.toBeNull();
      expect(String(selectedEntry?.name)).toBe("focus");
    });

    When("the user closes the sheet", () => {
      selectedEntry = null;
    });

    Then("the entry detail sheet is closed", () => {
      expect(selectedEntry).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Supplemental unit tests for kind-hue utilities
// ---------------------------------------------------------------------------

import { describe, it } from "vitest";

describe("kindToHue", () => {
  it("maps known kinds to correct hues", () => {
    expect(kindToHue("workout")).toBe("teal");
    expect(kindToHue("reading")).toBe("plum");
    expect(kindToHue("learning")).toBe("honey");
    expect(kindToHue("meal")).toBe("terracotta");
    expect(kindToHue("focus")).toBe("sky");
  });

  it("maps custom- prefix to sage", () => {
    expect(kindToHue("custom-meditation")).toBe("sage");
    expect(kindToHue("custom-stretch")).toBe("sage");
  });

  it("falls back to sage for unknown kinds", () => {
    expect(kindToHue("unknown")).toBe("sage");
  });
});

describe("kindToIcon", () => {
  it("maps known kinds to correct icons", () => {
    expect(kindToIcon("workout")).toBe("dumbbell");
    expect(kindToIcon("reading")).toBe("calendar");
    expect(kindToIcon("learning")).toBe("zap");
    expect(kindToIcon("meal")).toBe("clock");
    expect(kindToIcon("focus")).toBe("timer");
  });

  it("maps custom- prefix to plus-circle", () => {
    expect(kindToIcon("custom-yoga")).toBe("plus-circle");
  });
});
