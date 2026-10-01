// AI benchmark — regressions for the 2026-10-01 usability pass (local-tmp/web-usability): caveats
// follow a recommendation, price comparisons name their basis, notes are localized, and the table
// keeps each row's model name in view while scrolling sideways.

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { dataset } from "../../../../../src/features/ai-benchmark/core/data/models";
import { scoreModels } from "../../../../../src/features/ai-benchmark/core/tiers";
import { ModelTable } from "../../../../../src/features/ai-benchmark/shell/model-table";
import { ID_NOTES, noteText } from "../../../../../src/features/ai-benchmark/shell/note-text";
import { SubstituteFinder } from "../../../../../src/features/ai-benchmark/shell/substitute-finder";

afterEach(cleanup);

const allNotes = [...new Set(dataset.models.flatMap((m) => [m.note, m.price?.note]).filter((n) => n !== undefined))];
const byId = (id: string) => dataset.models.find((m) => m.id === id)!;

function finder(id: string, locale: "en" | "id" = "en") {
  render(<SubstituteFinder dataset={dataset} selectedId={id} locale={locale} onSelect={() => undefined} />);
}

describe("noteText", () => {
  it("has an Indonesian rendering for every model and price note in the dataset", () => {
    for (const note of allNotes) expect(ID_NOTES[note], note).toBeTruthy();
  });

  it("keeps no translation for a note the dataset no longer carries", () => {
    for (const key of Object.keys(ID_NOTES)) expect(allNotes, key).toContain(key);
  });

  it("returns the English note unchanged for the en locale and the translation for id", () => {
    const note = allNotes[0]!;
    expect(noteText(note, "en")).toBe(note);
    expect(noteText(note, "id")).toBe(ID_NOTES[note]);
  });
});

describe("SubstituteFinder caveats and price basis", () => {
  it("shows a substitute's model and price notes on its card", () => {
    finder("claude-opus-4-8");
    const muse = byId("muse-spark-1.3");
    const card = screen.getAllByTestId("ai-bench-sub-item").find((li) => li.dataset.modelId === muse.id)!;
    for (const note of [muse.note, muse.price?.note].filter((n) => n !== undefined)) {
      expect(within(card).getByText(note)).toBeTruthy();
    }
  });

  it("localizes a substitute's notes on the Indonesian page", () => {
    finder("claude-opus-4-8", "id");
    const muse = byId("muse-spark-1.3");
    const card = screen.getAllByTestId("ai-bench-sub-item").find((li) => li.dataset.modelId === muse.id)!;
    expect(within(card).getByText(ID_NOTES[muse.price!.note!]!)).toBeTruthy();
  });

  it("names the per-token basis of the price comparison", () => {
    finder("claude-opus-4-8");
    for (const el of screen.getAllByTestId("ai-bench-sub-compare")) expect(el.textContent).toMatch(/per token/);
  });

  it("says so when no listed substitute is cheaper than the chosen model", () => {
    finder("gpt-6-luna");
    expect(screen.getByTestId("ai-bench-finder-none-cheaper").textContent).toContain("GPT-6 Luna");
  });

  it("omits that message when a cheaper substitute exists", () => {
    finder("claude-opus-4-8");
    expect(screen.queryByTestId("ai-bench-finder-none-cheaper")).toBeNull();
  });

  it("points to the data table when the chosen model has too few results", () => {
    const insufficient = scoreModels(dataset).find(
      (s) => s.tier === "insufficient" && ["Anthropic", "OpenAI", "Google", "xAI"].includes(s.model.vendor),
    )!;
    finder(insufficient.model.id);
    expect(screen.getByTestId("ai-bench-finder-summary").textContent).toMatch(/table/);
  });
});

describe("ModelTable readability", () => {
  function table(locale: "en" | "id" = "en") {
    render(<ModelTable rows={scoreModels(dataset)} locale={locale} />);
  }

  it("keeps each row's model name pinned while the table scrolls sideways", () => {
    table();
    for (const th of screen.getByTestId("ai-bench-table").querySelectorAll("th:first-child")) {
      expect(th.className).toMatch(/\bsticky\b/);
      expect(th.className).toMatch(/\bleft-0\b/);
      expect(th.className).toMatch(/\bbg-/);
    }
  });

  it("shows the scroll hint at every width, since the table is wider than the page column", () => {
    table();
    expect(screen.getByText("Scroll sideways to see every column.").className).not.toMatch(/hidden/);
  });

  it("names each score link by model and benchmark", () => {
    table();
    const row = screen.getAllByTestId("ai-bench-table-row").find((r) => r.dataset.modelId === "glm-5.3")!;
    const link = within(row).getAllByRole("link")[0]!;
    expect(link.getAttribute("aria-label")).toMatch(/^GLM-5\.3, DeepSWE 1\.1: 61\.4%/);
  });

  it("shows an em dash for a model no harness exposes", () => {
    table();
    const model = dataset.models.find((m) => m.harnesses.length === 0)!;
    const row = screen.getAllByTestId("ai-bench-table-row").find((r) => r.dataset.modelId === model.id)!;
    expect(within(row).getByTestId("ai-bench-table-harnesses").textContent).toBe("—");
  });

  it("localizes notes on the Indonesian table", () => {
    table("id");
    const model = dataset.models.find((m) => m.note !== undefined)!;
    const row = screen.getAllByTestId("ai-bench-table-row").find((r) => r.dataset.modelId === model.id)!;
    expect(within(row).getByText(ID_NOTES[model.note!]!)).toBeTruthy();
  });
});
