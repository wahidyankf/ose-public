// AI BENCHMARK — models with too few independent results for an index, in a closed disclosure so
// they stay reachable without crowding the tier map. Each shows whatever scored figures it has.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { BENCHMARK_SPECS, MIN_SCORED_BENCHMARKS } from "../core/data/benchmarks";
import { operatorById } from "../core/data/operators";
import { scoredFigure } from "../core/score";
import type { ScoredModel } from "../core/tiers";
import { formatPercent, tf } from "./format";
import { LimitedChip } from "./model-bits";

export type InsufficientListProps = {
  models: readonly ScoredModel[];
  locale: Locale;
};

function Scores({ s, locale }: { s: ScoredModel; locale: Locale }) {
  const parts = BENCHMARK_SPECS.flatMap((b) => {
    const f = scoredFigure(s.model, b.id);
    return f === undefined
      ? []
      : [`${b.name} ${b.version} ${formatPercent(f.value, locale)} (${operatorById(f.operator).shortName})`];
  });
  return (
    <span data-testid="ai-bench-insufficient-scores" className="text-xs text-muted-foreground">
      {parts.length === 0 ? t(locale, "aiBenchInsufficientNone") : parts.join(" · ")}
    </span>
  );
}

export function InsufficientList({ models, locale }: InsufficientListProps) {
  if (models.length === 0) return null;
  const sorted = [...models].sort((a, b) => a.model.name.localeCompare(b.model.name));
  return (
    <details data-testid="ai-bench-insufficient" className="rounded-lg border bg-card">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-semibold">
        <h2 className="text-base">{tf(locale, "aiBenchInsufficientHeading", { count: models.length })}</h2>
      </summary>
      <div className="space-y-2 border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {tf(locale, "aiBenchInsufficientIntro", { min: MIN_SCORED_BENCHMARKS })}
        </p>
        <ul className="divide-y">
          {sorted.map((s) => (
            <li key={s.model.id} data-testid="ai-bench-insufficient-item" data-model-id={s.model.id} className="py-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold">{s.model.name}</span>
                <span className="text-xs text-muted-foreground">{s.model.vendor}</span>
                <LimitedChip model={s.model} locale={locale} />
              </div>
              <Scores s={s} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
