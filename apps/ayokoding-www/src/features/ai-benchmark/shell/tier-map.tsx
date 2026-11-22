// AI BENCHMARK — the tier map: one section per rated tier stating the consensus rule, with one
// row per shown model. The bar is decorative (aria-hidden); the consensus count beside it is the
// value. No composite anchor, floor, or index is shown anywhere here.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { BENCHMARK_SPECS, benchmarkSpec } from "../core/data/benchmarks";
import type { AnchoredTier, BenchmarkId, Tier } from "../core/data/types";
import type { BenchmarkTierGroups, BenchmarkTierRow, ConsensusModel, TierGroups } from "../core/tiers";
import { formatPercent, tf } from "./format";
import { AnchorChip, LimitedChip, PriceText } from "./model-bits";
import { TIER_BG_CLASS, TIER_BORDER_CLASS, TierSwatch, tierLabel, tierUse } from "./tier-style";

export type RatedTier = Exclude<Tier, "insufficient" | "no-consensus">;

export const RATED_TIERS: readonly RatedTier[] = ["ultra", "planning", "execution", "fast"];

export type TierMapProps = {
  groups: TierGroups;
  /** The tiers to draw, in order. */
  tiers: readonly RatedTier[];
  locale: Locale;
};

function TierRow({ s, locale }: { s: ConsensusModel; locale: Locale }) {
  return (
    <li data-testid="ai-bench-tier-row" data-model-id={s.model.id} className="py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span data-testid="ai-bench-tier-row-name" className="text-sm font-semibold">
          {s.model.name}
        </span>
        <span className="text-xs text-muted-foreground">{s.model.vendor}</span>
        <LimitedChip model={s.model} locale={locale} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div aria-hidden="true" className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            data-testid="ai-bench-bar"
            className={`h-full rounded-full ${TIER_BG_CLASS[s.tier]}`}
            style={{ width: `${(s.agreeing / BENCHMARK_SPECS.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-right text-sm tabular-nums">
          <span data-testid="ai-bench-tier-row-count" className="font-semibold">
            {tf(locale, "aiBenchTierConsensusCount", { agreeing: s.agreeing, considered: s.considered })}
          </span>
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        <PriceText model={s.model} locale={locale} />
      </p>
    </li>
  );
}

export function TierMap({ groups, tiers, locale }: TierMapProps) {
  return (
    <section aria-labelledby="ai-bench-tier-map-heading" data-testid="ai-bench-tier-map" className="space-y-4">
      <h2 id="ai-bench-tier-map-heading" className="text-xl font-semibold">
        {t(locale, "aiBenchTierMapHeading")}
      </h2>
      {tiers.map((tier) => (
        <section
          key={tier}
          aria-labelledby={`ai-bench-tier-${tier}-heading`}
          data-testid={`ai-bench-tier-${tier}`}
          className={`rounded-lg border border-l-4 bg-card p-4 ${TIER_BORDER_CLASS[tier]}`}
        >
          <h3 id={`ai-bench-tier-${tier}-heading`} className="flex items-center gap-2 text-lg font-semibold">
            <TierSwatch tier={tier} />
            {tierLabel(tier, locale)}
          </h3>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            <p>{tierUse(tier, locale)}</p>
            <p data-testid="ai-bench-tier-rule">
              {tf(locale, "aiBenchTierConsensusRule", { tier: tierLabel(tier, locale) })}
            </p>
          </div>
          {groups[tier].length === 0 ? (
            <p data-testid="ai-bench-tier-empty" className="mt-3 text-sm text-muted-foreground italic">
              {t(locale, "aiBenchTierEmpty")}
            </p>
          ) : (
            <ol className="mt-2 divide-y">
              {groups[tier].map((s) => (
                <TierRow key={s.model.id} s={s} locale={locale} />
              ))}
            </ol>
          )}
        </section>
      ))}
    </section>
  );
}

function BenchmarkTierRowView({
  r,
  anchorIds,
  locale,
}: {
  r: BenchmarkTierRow;
  anchorIds: ReadonlySet<string>;
  locale: Locale;
}) {
  return (
    <li data-testid="ai-bench-tier-row" data-model-id={r.model.id} className="py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span data-testid="ai-bench-tier-row-name" className="text-sm font-semibold">
          {r.model.name}
        </span>
        <span className="text-xs text-muted-foreground">{r.model.vendor}</span>
        {anchorIds.has(r.model.id) && <AnchorChip locale={locale} />}
        <LimitedChip model={r.model} locale={locale} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div aria-hidden="true" className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            data-testid="ai-bench-bar"
            className={`h-full rounded-full ${TIER_BG_CLASS[r.tier]}`}
            style={{ width: `${r.score}%` }}
          />
        </div>
        <span className="w-16 shrink-0 text-right text-sm tabular-nums">
          <span className="sr-only">{t(locale, "aiBenchScoreLabel")} </span>
          <span data-testid="ai-bench-tier-row-index" className="font-semibold">
            {formatPercent(r.score, locale)}
          </span>
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        <PriceText model={r.model} locale={locale} />
      </p>
    </li>
  );
}

function BenchmarkFloorLine({
  tier,
  anchors,
  benchmark,
  locale,
}: {
  tier: RatedTier;
  anchors: BenchmarkTierMapProps["anchors"];
  benchmark: BenchmarkId;
  locale: Locale;
}) {
  const name = benchmarkSpec(benchmark).name;
  if (tier === "fast") {
    return <p data-testid="ai-bench-tier-floor">{tf(locale, "aiBenchTierBenchmarkFastFloor", { benchmark: name })}</p>;
  }
  const anchor = anchors[tier];
  if (anchor === undefined) return null;
  return (
    <p data-testid="ai-bench-tier-floor">
      {tf(locale, "aiBenchTierBenchmarkFloor", {
        benchmark: name,
        score: formatPercent(anchor.score, locale),
        anchor: anchor.model.name,
      })}
    </p>
  );
}

export type BenchmarkTierMapProps = {
  groups: BenchmarkTierGroups;
  anchors: Record<AnchoredTier, BenchmarkTierRow | undefined>;
  benchmark: BenchmarkId;
  /** The tiers to draw, in order. */
  tiers: readonly RatedTier[];
  locale: Locale;
};

/**
 * The per-benchmark view: tier sections for the chosen benchmark, mirroring {@link TierMap}.
 * Each anchored section names its per-benchmark anchor and floor as a raw score on that
 * benchmark; bars are tier-coloured and scale with the raw score. Models with no scored figure
 * on the benchmark are not grouped here — they go to the unranked disclosure.
 */
export function BenchmarkTierMap({ groups, anchors, benchmark, tiers, locale }: BenchmarkTierMapProps) {
  const anchorIds = new Set(
    (Object.values(anchors) as (BenchmarkTierRow | undefined)[])
      .map((a) => a?.model.id)
      .filter((id): id is string => id !== undefined),
  );
  return (
    <section aria-labelledby="ai-bench-rank-list-heading" data-testid="ai-bench-tier-map" className="space-y-4">
      <h2 id="ai-bench-rank-list-heading" className="text-xl font-semibold">
        {tf(locale, "aiBenchRankListHeading", { benchmark: benchmarkSpec(benchmark).name })}
      </h2>
      {tiers.map((tier) => (
        <section
          key={tier}
          aria-labelledby={`ai-bench-tier-${tier}-heading`}
          data-testid={`ai-bench-tier-${tier}`}
          className={`rounded-lg border border-l-4 bg-card p-4 ${TIER_BORDER_CLASS[tier]}`}
        >
          <h3 id={`ai-bench-tier-${tier}-heading`} className="flex items-center gap-2 text-lg font-semibold">
            <TierSwatch tier={tier} />
            {tierLabel(tier, locale)}
          </h3>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            <p>{tierUse(tier, locale)}</p>
            <BenchmarkFloorLine tier={tier} anchors={anchors} benchmark={benchmark} locale={locale} />
          </div>
          {groups[tier].length === 0 ? (
            <p data-testid="ai-bench-tier-empty" className="mt-3 text-sm text-muted-foreground italic">
              {t(locale, "aiBenchTierEmpty")}
            </p>
          ) : (
            <ol className="mt-2 divide-y">
              {groups[tier].map((r) => (
                <BenchmarkTierRowView key={r.model.id} r={r} anchorIds={anchorIds} locale={locale} />
              ))}
            </ol>
          )}
        </section>
      ))}
    </section>
  );
}
