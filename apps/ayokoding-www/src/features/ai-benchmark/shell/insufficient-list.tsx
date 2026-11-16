// AI BENCHMARK — models with too few independent results for a consensus tier, in a closed
// disclosure so they stay reachable without crowding the tier map. Each shows whatever scored
// figures it has.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { BENCHMARK_SPECS, MIN_SCORED_BENCHMARKS, benchmarkSpec } from "../core/data/benchmarks";
import { operatorById } from "../core/data/operators";
import type { BenchmarkId } from "../core/data/types";
import { scoredFigure } from "../core/score";
import type { ConsensusModel } from "../core/tiers";
import { formatPercent, tf } from "./format";
import { LimitedChip } from "./model-bits";

export type InsufficientListProps = {
  models: readonly ConsensusModel[];
  locale: Locale;
  /**
   * When set, the disclosure lists models with no scored figure on this benchmark (the
   * per-benchmark view's unranked rest) instead of the composite's insufficient-data models.
   */
  unrankedBenchmark?: BenchmarkId;
};

/** Whatever independent scores a tierless model has, in text. Shared with the no-consensus disclosure. */
export function ModelScores({
  s,
  locale,
  testId = "ai-bench-insufficient-scores",
}: {
  s: ConsensusModel;
  locale: Locale;
  testId?: string;
}) {
  const parts = BENCHMARK_SPECS.flatMap((b) => {
    const f = scoredFigure(s.model, b.id);
    return f === undefined
      ? []
      : [`${b.name} ${b.version} ${formatPercent(f.value, locale)} (${operatorById(f.operator).shortName})`];
  });
  return (
    <span data-testid={testId} className="text-xs text-muted-foreground">
      {parts.length === 0 ? t(locale, "aiBenchInsufficientNone") : parts.join(" · ")}
    </span>
  );
}

/** One tierless model row: name, vendor, access label, and whatever independent scores it has. */
export function TierlessModelItem({
  s,
  locale,
  itemTestId = "ai-bench-insufficient-item",
  scoresTestId = "ai-bench-insufficient-scores",
}: {
  s: ConsensusModel;
  locale: Locale;
  itemTestId?: string;
  scoresTestId?: string;
}) {
  return (
    <li key={s.model.id} data-testid={itemTestId} data-model-id={s.model.id} className="py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold">{s.model.name}</span>
        <span className="text-xs text-muted-foreground">{s.model.vendor}</span>
        <LimitedChip model={s.model} locale={locale} />
      </div>
      <ModelScores s={s} locale={locale} testId={scoresTestId} />
    </li>
  );
}

export function InsufficientList({ models, locale, unrankedBenchmark }: InsufficientListProps) {
  if (models.length === 0) return null;
  const sorted = [...models].sort((a, b) => a.model.name.localeCompare(b.model.name));
  const name = unrankedBenchmark === undefined ? undefined : benchmarkSpec(unrankedBenchmark).name;
  return (
    <details data-testid="ai-bench-insufficient" className="rounded-lg border bg-card">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-semibold">
        <h2 className="text-base">
          {name === undefined
            ? tf(locale, "aiBenchInsufficientHeading", { count: models.length })
            : tf(locale, "aiBenchUnrankedHeading", { benchmark: name, count: models.length })}
        </h2>
      </summary>
      <div className="space-y-2 border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {name === undefined
            ? tf(locale, "aiBenchInsufficientIntro", { min: MIN_SCORED_BENCHMARKS })
            : tf(locale, "aiBenchUnrankedIntro", { benchmark: name })}
        </p>
        <ul className="divide-y">
          {sorted.map((s) => (
            <TierlessModelItem key={s.model.id} s={s} locale={locale} />
          ))}
        </ul>
      </div>
    </details>
  );
}
