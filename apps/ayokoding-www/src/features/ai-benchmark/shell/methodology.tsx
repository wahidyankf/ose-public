// AI BENCHMARK — "How the score works". Every rule, version, weight, operator, and anchor is read
// from `core/data/benchmarks.ts`, and the worked example is computed live from the dataset, so
// the explanation cannot drift from the scoring code.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import {
  ANCHORED_TIERS,
  BENCHMARK_SPECS,
  METHOD_EXAMPLE,
  MIN_SCORED_BENCHMARKS,
  TIER_ANCHORS,
  rosterScopeParams,
} from "../core/data/benchmarks";
import { operatorById } from "../core/data/operators";
import type { BenchmarkId, Dataset } from "../core/data/types";
import { compositeIndex, scoredBenchmarks, scoredFigure } from "../core/score";
import { meetsAnchor, tierAnchors } from "../core/tiers";
import { formatIndex, tf } from "./format";
import { tierLabel } from "./tier-style";

export const METHODOLOGY_ID = "ai-bench-methodology";

const DESCRIPTION_KEYS: Record<BenchmarkId, string> = {
  "deep-swe": "aiBenchMethodBenchDeepSwe",
  "terminal-bench": "aiBenchMethodBenchTerminal",
  "swe-atlas-qna": "aiBenchMethodBenchQna",
};

function IndexExample({ dataset, locale }: { dataset: Dataset; locale: Locale }) {
  const model = dataset.models.find((m) => m.id === METHOD_EXAMPLE.indexModel);
  const index = model === undefined ? undefined : compositeIndex(model);
  if (model === undefined || index === undefined) return null;
  const benchmarks = scoredBenchmarks(model);
  const scores = benchmarks.map((b) => formatIndex(scoredFigure(model, b)?.value ?? 0, locale)).join(" + ");
  return (
    <p data-testid="ai-bench-method-example-index" data-model-id={model.id}>
      {tf(locale, "aiBenchMethodExampleIndex", {
        model: model.name,
        scores,
        count: benchmarks.length,
        index: formatIndex(index, locale),
      })}
    </p>
  );
}

function CompareExample({ dataset, locale }: { dataset: Dataset; locale: Locale }) {
  const model = dataset.models.find((m) => m.id === METHOD_EXAMPLE.compareModel);
  const anchor = dataset.models.find((m) => m.id === TIER_ANCHORS[METHOD_EXAMPLE.compareTier]);
  const modelScore = model === undefined ? undefined : compositeIndex(model);
  const anchorScore = anchor === undefined ? undefined : compositeIndex(anchor);
  if (model === undefined || anchor === undefined || modelScore === undefined || anchorScore === undefined) return null;
  return (
    <p data-testid="ai-bench-method-example-compare">
      {tf(locale, "aiBenchMethodExampleCompare", {
        model: model.name,
        tier: tierLabel(METHOD_EXAMPLE.compareTier, locale),
        anchor: anchor.name,
        modelScore: formatIndex(modelScore, locale),
        anchorScore: formatIndex(anchorScore, locale),
        result: t(locale, meetsAnchor(model, anchor) ? "aiBenchMethodMeets" : "aiBenchMethodMisses"),
      })}
    </p>
  );
}

export function Methodology({ dataset, locale }: { dataset: Dataset; locale: Locale }) {
  const anchors = tierAnchors(dataset);
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
                {tf(locale, "aiBenchMethodVersion", { version: b.version })},{" "}
                {tf(locale, "aiBenchMethodWeight", { weight: b.weight })}. {t(locale, DESCRIPTION_KEYS[b.id])}
                <div className="text-muted-foreground" data-testid="ai-bench-method-operator-order">
                  {t(locale, "aiBenchMethodSourceOrderIntro")}{" "}
                  {b.operatorOrder.map((o) => operatorById(o).shortName).join(" → ")}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p data-testid="ai-bench-method-roster">{tf(locale, "aiBenchMethodRoster", rosterScopeParams())}</p>
        <p data-testid="ai-bench-method-index">{tf(locale, "aiBenchMethodIndex", { min: MIN_SCORED_BENCHMARKS })}</p>
        <p>{t(locale, "aiBenchMethodTiers")}</p>
        <div>
          <p>{t(locale, "aiBenchMethodAnchorsIntro")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {ANCHORED_TIERS.map((tier) => {
              const a = anchors[tier];
              if (a === undefined || a.index === undefined) return null;
              return (
                <li key={tier} data-testid="ai-bench-method-anchor" data-tier={tier}>
                  <span className="font-semibold">{tierLabel(tier, locale)}</span>: {a.model.name} (
                  {t(locale, "aiBenchIndexLabel")} {formatIndex(a.index, locale)})
                </li>
              );
            })}
          </ul>
        </div>
        <p>{t(locale, "aiBenchMethodPrice")}</p>
        <p>{t(locale, "aiBenchMethodCostPerTask")}</p>
        <p>{t(locale, "aiBenchMethodCaveat")}</p>
        <p>{t(locale, "aiBenchMethodExcluded")}</p>
        <div className="space-y-1 rounded-md bg-muted/50 p-3">
          <h3 className="font-semibold">{t(locale, "aiBenchMethodExampleHeading")}</h3>
          <IndexExample dataset={dataset} locale={locale} />
          <CompareExample dataset={dataset} locale={locale} />
        </div>
      </div>
    </details>
  );
}
