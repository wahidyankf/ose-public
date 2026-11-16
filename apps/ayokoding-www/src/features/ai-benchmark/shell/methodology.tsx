// AI BENCHMARK — "How the score works". Every rule, version, operator, and per-benchmark anchor
// is read from `core/data/benchmarks.ts`, so the explanation cannot drift from the scoring code.
// No average or composite score is computed anywhere on the page.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { ANCHORED_TIERS, BENCHMARK_SPECS, MIN_SCORED_BENCHMARKS, rosterScopeParams } from "../core/data/benchmarks";
import { operatorById } from "../core/data/operators";
import type { BenchmarkId, Dataset } from "../core/data/types";
import { benchmarkTierAnchors } from "../core/tiers";
import { formatPercent, tf } from "./format";
import { tierLabel } from "./tier-style";

export const METHODOLOGY_ID = "ai-bench-methodology";

const DESCRIPTION_KEYS: Record<BenchmarkId, string> = {
  "deep-swe": "aiBenchMethodBenchDeepSwe",
  "terminal-bench": "aiBenchMethodBenchTerminal",
  "swe-atlas-qna": "aiBenchMethodBenchQna",
  "frontiercode-aa": "aiBenchMethodBenchFrontier",
};

function BenchmarkAnchorItem({
  dataset,
  benchmark,
  locale,
}: {
  dataset: Dataset;
  benchmark: BenchmarkId;
  locale: Locale;
}) {
  const anchors = benchmarkTierAnchors(dataset, benchmark);
  const parts = ANCHORED_TIERS.flatMap((tier) => {
    const a = anchors[tier];
    return a === undefined ? [] : [`${tierLabel(tier, locale)} ${a.model.name} (${formatPercent(a.score, locale)})`];
  });
  if (parts.length === 0) return null;
  return (
    <li data-testid="ai-bench-method-benchmark-anchor" data-benchmark={benchmark}>
      <span className="font-semibold">{BENCHMARK_SPECS.find((b) => b.id === benchmark)!.name}</span>
      {": "}
      {parts.join(" · ")}
    </li>
  );
}

export function Methodology({ dataset, locale }: { dataset: Dataset; locale: Locale }) {
  return (
    <details id={METHODOLOGY_ID} data-testid="ai-bench-methodology" className="scroll-mt-20 rounded-lg border bg-card">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2">
        <h2 className="text-xl font-semibold">{t(locale, "aiBenchMethodHeading")}</h2>
      </summary>
      <div className="space-y-4 border-t px-4 py-4 text-sm leading-relaxed">
        <div className="space-y-2">
          <p>{t(locale, "aiBenchMethodBenchmarksIntro")}</p>
          <ul className="space-y-2">
            {BENCHMARK_SPECS.map((b) => (
              <li key={b.id} data-testid="ai-bench-method-benchmark" data-benchmark={b.id}>
                <span className="font-semibold">{b.name}</span>
                {" — "}
                {tf(locale, "aiBenchMethodVersion", { version: b.version })}. {t(locale, DESCRIPTION_KEYS[b.id])}
                <div className="text-muted-foreground" data-testid="ai-bench-method-operator-order">
                  {t(locale, "aiBenchMethodSourceOrderIntro")}{" "}
                  {b.operatorOrder.map((o) => operatorById(o).shortName).join(" → ")}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p data-testid="ai-bench-method-roster">{tf(locale, "aiBenchMethodRoster", rosterScopeParams(locale))}</p>
        <p data-testid="ai-bench-method-index">{tf(locale, "aiBenchMethodIndex", { min: MIN_SCORED_BENCHMARKS })}</p>
        <p data-testid="ai-bench-method-score-basis">
          {tf(locale, "aiBenchMethodScoreBasis", {
            consensus: t(locale, "aiBenchScoreBasisConsensus"),
            options: BENCHMARK_SPECS.map((b) => b.name).join(", "),
          })}
        </p>
        <p data-testid="ai-bench-method-consensus">{t(locale, "aiBenchMethodConsensus")}</p>
        <p data-testid="ai-bench-method-consensus-order">{t(locale, "aiBenchMethodConsensusOrder")}</p>
        <p data-testid="ai-bench-method-no-average">{t(locale, "aiBenchMethodNoAverage")}</p>
        <p data-testid="ai-bench-method-raw">{t(locale, "aiBenchMethodRawScores")}</p>
        <p data-testid="ai-bench-method-unranked">{t(locale, "aiBenchMethodUnranked")}</p>
        <p data-testid="ai-bench-method-benchmark-tiers">{t(locale, "aiBenchMethodBenchmarkTiers")}</p>
        <div>
          <p>{t(locale, "aiBenchMethodBenchmarkAnchorsIntro")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {BENCHMARK_SPECS.map((b) => (
              <BenchmarkAnchorItem key={b.id} dataset={dataset} benchmark={b.id} locale={locale} />
            ))}
          </ul>
        </div>
        <p>{t(locale, "aiBenchMethodPrice")}</p>
        <p>{t(locale, "aiBenchMethodCostPerTask")}</p>
        <p>{t(locale, "aiBenchMethodCaveat")}</p>
        <p>{t(locale, "aiBenchMethodExcluded")}</p>
      </div>
    </details>
  );
}
