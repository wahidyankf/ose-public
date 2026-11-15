// The methodology names the five score-basis options and the per-benchmark rules, in both
// locales, without leaking raw translation keys.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ANCHORED_TIERS,
  BENCHMARK_SPECS,
  BENCHMARK_TIER_ANCHORS,
} from "../../../../../src/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "../../../../../src/features/ai-benchmark/core/data/models";
import { benchmarkScore } from "../../../../../src/features/ai-benchmark/core/score";
import { Methodology } from "../../../../../src/features/ai-benchmark/shell/methodology";
import { formatPercent } from "../../../../../src/features/ai-benchmark/shell/format";
import type { Locale } from "../../../../../src/features/i18n/core/config";
import { t } from "../../../../../src/features/i18n/core/translations";

afterEach(cleanup);

describe.each<[Locale]>([["en"], ["id"]])("Methodology per-benchmark statements in %s", (locale) => {
  it("names the five score basis options with no raw keys", () => {
    render(<Methodology dataset={dataset} locale={locale} />);
    const text = screen.getByTestId("ai-bench-method-score-basis").textContent!;
    expect(text).toContain(t(locale, "aiBenchScoreBasisAverage"));
    for (const b of BENCHMARK_SPECS) expect(text, b.id).toContain(b.name);
    expect(text).not.toMatch(/aiBench|\{\w+\}/);
  });

  it("states raw figures and the unranked rule with no raw keys", () => {
    render(<Methodology dataset={dataset} locale={locale} />);
    expect(screen.getByTestId("ai-bench-method-raw").textContent).toBe(t(locale, "aiBenchMethodRawScores"));
    expect(screen.getByTestId("ai-bench-method-unranked").textContent).toBe(t(locale, "aiBenchMethodUnranked"));
    for (const id of ["ai-bench-method-raw", "ai-bench-method-unranked"] as const) {
      expect(screen.getByTestId(id).textContent).not.toMatch(/aiBench|\{\w+\}/);
    }
  });

  it("states that a per-benchmark tier compares raw scores on that benchmark only", () => {
    render(<Methodology dataset={dataset} locale={locale} />);
    const text = screen.getByTestId("ai-bench-method-benchmark-tiers").textContent!;
    expect(text).toBe(t(locale, "aiBenchMethodBenchmarkTiers"));
    expect(text).not.toMatch(/aiBench|\{\w+\}/);
  });

  it("lists every benchmark with its ultra, planning, and execution anchor and floor score", () => {
    render(<Methodology dataset={dataset} locale={locale} />);
    const items = screen.getAllByTestId("ai-bench-method-benchmark-anchor");
    expect(items.map((i) => i.getAttribute("data-benchmark"))).toEqual(BENCHMARK_SPECS.map((b) => b.id));
    for (const item of items) {
      const benchmark = item.getAttribute("data-benchmark")!;
      const spec = BENCHMARK_SPECS.find((b) => b.id === benchmark)!;
      const text = item.textContent!;
      expect(text).toContain(spec.name);
      for (const tier of ANCHORED_TIERS) {
        const anchor = dataset.models.find((m) => m.id === BENCHMARK_TIER_ANCHORS[spec.id][tier])!;
        expect(text, `${benchmark}/${tier}`).toContain(anchor.name);
        expect(text, `${benchmark}/${tier}`).toContain(formatPercent(benchmarkScore(anchor, spec.id)!, locale));
      }
      expect(text).not.toMatch(/aiBench|\{\w+\}/);
    }
    expect(screen.getByText(t(locale, "aiBenchMethodBenchmarkAnchorsIntro")).textContent).not.toMatch(
      /aiBench|\{\w+\}/,
    );
  });
});
