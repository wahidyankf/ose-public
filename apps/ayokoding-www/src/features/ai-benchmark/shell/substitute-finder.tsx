// AI BENCHMARK — "find an OpenCode Go substitute": pick a frontier model, see the OpenCode Go
// models that reach at least its tier, with a price comparison. Always judged on the full roster.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { FRONTIER_VENDORS } from "../core/data/benchmarks";
import type { Dataset, Model } from "../core/data/types";
import { blendedPrice, priceRatio } from "../core/price";
import { frontierModels, substitutesFor } from "../core/substitute";
import { compositeIndex } from "../core/score";
import { assignTier, type ScoredModel } from "../core/tiers";
import { formatIndex, formatUsd, isCheaper, priceComparison, tf } from "./format";
import { LimitedChip, PriceText, modelNotes } from "./model-bits";
import { SelectField } from "./select-field";
import { TierSwatch, tierLabel } from "./tier-style";

export type SubstituteFinderProps = {
  dataset: Dataset;
  selectedId: string | undefined;
  locale: Locale;
  onSelect: (id: string | undefined) => void;
};

function TargetSummary({ target, dataset, locale }: { target: Model; dataset: Dataset; locale: Locale }) {
  const index = compositeIndex(target);
  if (index === undefined) {
    return (
      <p data-testid="ai-bench-finder-summary">{tf(locale, "aiBenchFinderInsufficient", { model: target.name })}</p>
    );
  }
  const blended = blendedPrice(target.price);
  const values = {
    model: target.name,
    tier: tierLabel(assignTier(target, dataset), locale),
    index: formatIndex(index, locale),
    price: blended === undefined ? "" : formatUsd(blended, locale),
  };
  return (
    <p data-testid="ai-bench-finder-summary">
      {tf(locale, blended === undefined ? "aiBenchFinderTargetNoPrice" : "aiBenchFinderTarget", values)}
    </p>
  );
}

function SubstituteItem({ s, target, locale }: { s: ScoredModel; target: Model; locale: Locale }) {
  const blended = blendedPrice(s.model.price);
  return (
    <li data-testid="ai-bench-sub-item" data-model-id={s.model.id} className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">{s.model.name}</span>
        <span className="text-sm text-muted-foreground">{s.model.vendor}</span>
        <LimitedChip model={s.model} locale={locale} />
      </div>
      <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t(locale, "aiBenchColTier")}</dt>
          <TierSwatch tier={s.tier} />
          <dd data-testid="ai-bench-sub-tier">{tierLabel(s.tier, locale)}</dd>
        </div>
        <div className="flex gap-1">
          <dt>{t(locale, "aiBenchIndexLabel")}</dt>
          <dd data-testid="ai-bench-sub-index" className="font-medium tabular-nums">
            {s.index === undefined ? "—" : formatIndex(s.index, locale)}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>{t(locale, "aiBenchColBlended")}</dt>
          <dd data-testid="ai-bench-sub-blended" className="tabular-nums">
            {blended === undefined ? "—" : formatUsd(blended, locale)}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t(locale, "aiBenchColBlended")}</dt>
          <dd data-testid="ai-bench-sub-compare" className="font-medium">
            {priceComparison(priceRatio(s.model, target), locale)}
          </dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-muted-foreground">
        <PriceText model={s.model} locale={locale} />
      </p>
      {/* A caveat (training on submissions, name routing, promotions) follows the recommendation. */}
      {modelNotes(s.model, locale).map((n) => (
        <p key={n} className="mt-1 text-xs text-muted-foreground">
          {n}
        </p>
      ))}
    </li>
  );
}

export function SubstituteFinder({ dataset, selectedId, locale, onSelect }: SubstituteFinderProps) {
  const frontier = frontierModels(dataset);
  const target = frontier.find((m) => m.id === selectedId);
  const result = target === undefined ? undefined : substitutesFor(target, dataset);
  const groups = FRONTIER_VENDORS.map((vendor) => ({
    label: vendor,
    options: frontier.filter((m) => m.vendor === vendor).map((m) => ({ value: m.id, label: m.name })),
  })).filter((g) => g.options.length > 0);

  return (
    <section
      aria-labelledby="ai-bench-finder-heading"
      data-testid="ai-bench-finder"
      className="space-y-3 rounded-lg border bg-card p-4 shadow-xs"
    >
      <div className="space-y-1">
        <h2 id="ai-bench-finder-heading" className="text-lg font-semibold">
          {t(locale, "aiBenchFinderHeading")}
        </h2>
        <p className="text-sm text-muted-foreground">{t(locale, "aiBenchFinderIntro")}</p>
      </div>
      <div className="max-w-md">
        <SelectField
          id="ai-bench-finder-select"
          label={t(locale, "aiBenchFinderLabel")}
          value={target?.id ?? ""}
          emptyLabel={t(locale, "aiBenchFinderPlaceholder")}
          options={groups}
          onChange={(v) => onSelect(v === "" ? undefined : v)}
        />
      </div>
      <div aria-live="polite" data-testid="ai-bench-finder-result" className="space-y-2">
        {target !== undefined && result !== undefined && (
          <>
            <TargetSummary target={target} dataset={dataset} locale={locale} />
            {result.kind !== "insufficient" && (
              <p data-testid="ai-bench-finder-lead" className="text-sm font-medium">
                {result.kind === "matches"
                  ? t(locale, "aiBenchFinderMatches")
                  : tf(locale, "aiBenchFinderNearest", { tier: tierLabel(assignTier(target, dataset), locale) })}
              </p>
            )}
            {result.models.length > 0 && (
              <ol
                className="grid grid-cols-1 gap-2 md:grid-cols-2"
                data-testid="ai-bench-sub-list"
                data-kind={result.kind}
              >
                {result.models.map((s) => (
                  <SubstituteItem key={s.model.id} s={s} target={target} locale={locale} />
                ))}
              </ol>
            )}
            {result.models.length > 0 && !result.models.some((s) => isCheaper(priceRatio(s.model, target))) && (
              <p data-testid="ai-bench-finder-none-cheaper" className="text-sm">
                {tf(locale, "aiBenchFinderNoneCheaper", { model: target.name })}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
