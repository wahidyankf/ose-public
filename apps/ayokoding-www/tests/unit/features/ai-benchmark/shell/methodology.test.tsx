// The methodology names the five score-basis options and the per-benchmark rules, in both
// locales, without leaking raw translation keys.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BENCHMARK_SPECS } from "../../../../../src/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "../../../../../src/features/ai-benchmark/core/data/models";
import { Methodology } from "../../../../../src/features/ai-benchmark/shell/methodology";
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
});
