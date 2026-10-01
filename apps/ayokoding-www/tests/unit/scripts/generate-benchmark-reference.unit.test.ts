import { describe, expect, it } from "vitest";
import {
  renderTables,
  substituteMarkers,
  type GeneratedTables,
} from "../../../src/scripts/generate-benchmark-reference";
import { dataset } from "../../../src/features/ai-benchmark/core/data/models";

/**
 * Tests for the governance-reference generator (DD-18). The pure functions under test do no disk
 * I/O — `renderTables(dataset)` derives every table from the dataset, and `substituteMarkers`
 * performs marker-delimited replacement on an in-memory string. The thin file-I/O shell that reads
 * and writes `docs/reference/ai-model-benchmarks.md` is exercised by the Nx targets, not here.
 */
describe("substituteMarkers — marker-delimited replacement", () => {
  it("replaces ONLY the text between a BEGIN/END pair and leaves every byte outside untouched", () => {
    const input = [
      "lead-in prose stays",
      "",
      "<!-- BEGIN GENERATED: roster -->",
      "old stale content that must vanish",
      "<!-- END GENERATED: roster -->",
      "",
      "trailing prose stays too",
      "",
    ].join("\n");

    const tables: GeneratedTables = {
      roster: "\n\nnew generated body\n",
    };

    const out = substituteMarkers(input, tables);

    // Bytes outside the marker pair are byte-identical.
    expect(out.startsWith("lead-in prose stays\n\n<!-- BEGIN GENERATED: roster -->")).toBe(true);
    expect(out.endsWith("<!-- END GENERATED: roster -->\n\ntrailing prose stays too\n")).toBe(true);
    // The inner content is fully replaced; the stale line is gone.
    expect(out).toContain("<!-- BEGIN GENERATED: roster -->");
    expect(out).toContain("<!-- END GENERATED: roster -->");
    expect(out).not.toContain("old stale content");
    expect(out).toContain("new generated body");
  });

  it("replaces multiple distinct marker pairs independently in one pass", () => {
    const input = [
      "<!-- BEGIN GENERATED: a -->",
      "AAA-old",
      "<!-- END GENERATED: a -->",
      "between",
      "<!-- BEGIN GENERATED: b -->",
      "BBB-old",
      "<!-- END GENERATED: b -->",
      "",
    ].join("\n");

    const out = substituteMarkers(input, {
      a: "\nA-new\n",
      b: "\nB-new\n",
    });

    expect(out).toContain("A-new");
    expect(out).toContain("B-new");
    expect(out).toContain("between");
    expect(out).not.toContain("AAA-old");
    expect(out).not.toContain("BBB-old");
  });

  it("throws loudly when a BEGIN marker has no matching END (marker-first guard)", () => {
    const input = ["<!-- BEGIN GENERATED: roster -->", "this pair is never closed", "more content", ""].join("\n");

    expect(() => substituteMarkers(input, { roster: "\nx\n" })).toThrow(/roster/);
  });

  it("throws when a BEGIN name differs from its following END name (mismatched pair)", () => {
    const input = ["<!-- BEGIN GENERATED: roster -->", "body", "<!-- END GENERATED: pricing -->", ""].join("\n");

    expect(() => substituteMarkers(input, { roster: "\nx\n", pricing: "\ny\n" })).toThrow(/roster/);
  });

  it("throws when the document references a marker name the generator does not produce", () => {
    const input = ["<!-- BEGIN GENERATED: unknown -->", "x", "<!-- END GENERATED: unknown -->", ""].join("\n");

    expect(() => substituteMarkers(input, { roster: "\ny\n" })).toThrow(/unknown/);
  });

  it("is idempotent: running substitution twice yields byte-identical output", () => {
    const input = [
      "intro prose",
      "",
      "<!-- BEGIN GENERATED: roster -->",
      "WHATEVER was here before",
      "<!-- END GENERATED: roster -->",
      "",
      "outro prose",
      "",
    ].join("\n");

    const tables: GeneratedTables = {
      roster: "\n\n| col |\n| --- |\n| v |\n\n",
    };

    const once = substituteMarkers(input, tables);
    const twice = substituteMarkers(once, tables);
    expect(twice).toBe(once);
    // And the once-result must itself contain exactly one rendered body (no duplication).
    expect(once.split("| v |").length).toBe(2); // exactly one occurrence
  });
});

describe("renderTables — pure derivation from the dataset", () => {
  it("produces an entry for each of the four generated reference sections", () => {
    const tables = renderTables(dataset);
    for (const name of ["roster", "pricing", "frontier", "capability-summary"]) {
      expect(tables).toHaveProperty(name);
      const block = tables[name];
      expect(typeof block).toBe("string");
      expect(block?.length).toBeGreaterThan(0);
    }
  });

  it("derives a markdown table (pipe header + separator) for the roster block", () => {
    const { roster } = renderTables(dataset);
    expect(roster).toContain("| ---");
    expect(roster).toContain("Model ID");
  });

  it("includes the dataset's last-updated date in every generated block", () => {
    for (const block of Object.values(renderTables(dataset))) expect(block).toContain(dataset.lastUpdated);
  });

  it("renders the ultra anchor (Claude Opus 5) with its composite index and tier", () => {
    const { "capability-summary": summary, frontier } = renderTables(dataset);
    expect(summary).toMatch(
      /\| Claude Opus 5 +\| Anthropic +\| 62\.54% \(AA\) +\| 54\.55% \(AA\) +\| 62\.10% \(AA\) +\| 59\.73 +\| ultra +\| \$10\.79 +\|/,
    );
    expect(frontier).toContain("Claude Opus 5");
  });

  it("names the operator of every non-AA figure and dashes a missing one", () => {
    const { "capability-summary": summary } = renderTables(dataset);
    expect(summary).toMatch(
      /\| GPT-5\.6 Terra +\| OpenAI +\| 69\.62% \(Datacurve\) +\| 21\.52% \(TB official\) +\| — +\| 45\.57 +\| execution +\| — +\|/,
    );
  });

  it("lists only OpenCode Go models in the roster block", () => {
    const { roster } = renderTables(dataset);
    expect(roster).toMatch(/\| glm-5\.3 +\| GLM-5\.3 +\| Z\.ai +\| execution +\|/);
    expect(roster).not.toContain("claude-opus-5");
  });

  it("prices every model with its blended rate and a dash when unpublished", () => {
    const { pricing } = renderTables(dataset);
    expect(pricing).toMatch(/\| Claude Opus 5\.5 +\| Anthropic +\| \$4 +\| \$20 +\| \$8 +\| vendor +\|/);
    expect(pricing).toMatch(/\| Gemini 4 Argon +\| Google +\| — +\| — +\| — +\| — +\|/);
  });

  it("is deterministic: two calls over the same dataset are byte-identical", () => {
    expect(renderTables(dataset)).toEqual(renderTables(dataset));
  });
});
