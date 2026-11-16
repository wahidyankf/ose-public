// AI BENCHMARK — the full data table: every shown model with the active view's tier, each
// scored benchmark figure (linked to its source and naming its operator), prices, cost per task,
// and harnesses. Rows run from the highest tier down, by consensus strength within a tier.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { BENCHMARK_SPECS, HARNESS_DISPLAY_NAMES } from "../core/data/benchmarks";
import { operatorById } from "../core/data/operators";
import type { Model } from "../core/data/types";
import { blendedPrice } from "../core/price";
import { scoredFigure } from "../core/score";
import { tableOrder, type TableRow } from "../core/tiers";
import { formatPercent, formatUsd, tf } from "./format";
import { LimitedChip, listedRateLabel, modelNotes } from "./model-bits";
import { TAP_TARGET_MIN_CLASS } from "./tap-target";
import { TIER_BG_CLASS, TierSwatch, tierLabel } from "./tier-style";

export type ModelTableProps = {
  rows: readonly TableRow[];
  locale: Locale;
};

const TH = "px-3 py-2 text-left align-bottom text-xs font-semibold whitespace-nowrap text-muted-foreground";
const TD = "px-3 py-2 align-top";
const NUM = `${TD} text-right tabular-nums whitespace-nowrap`;
const DASH = "—";
/**
 * The model-name column stays pinned while the table scrolls sideways, so a row of numbers never
 * loses its label; it needs an opaque background and a divider to read as a separate layer.
 */
const PINNED = "sticky left-0 z-10 border-r";

function tierCell(tier: TableRow["tier"], locale: Locale) {
  if (tier === "unranked") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${TIER_BG_CLASS.insufficient}`}
        />
        {t(locale, "aiBenchTierUnranked")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <TierSwatch tier={tier} />
      {tierLabel(tier, locale)}
    </span>
  );
}

function ScoreCell({
  model,
  benchmark,
  locale,
}: {
  model: Model;
  benchmark: (typeof BENCHMARK_SPECS)[number];
  locale: Locale;
}) {
  const f = scoredFigure(model, benchmark.id);
  if (f === undefined) return <td className={NUM}>{DASH}</td>;
  const op = operatorById(f.operator);
  const runBy = tf(locale, "aiBenchScoreRunBy", { operator: op.name, config: f.config });
  return (
    <td className={NUM} data-testid="ai-bench-score" data-benchmark={benchmark.id}>
      <a
        href={f.source}
        target="_blank"
        rel="noopener noreferrer"
        title={runBy}
        aria-label={`${model.name}, ${benchmark.name} ${benchmark.version}: ${formatPercent(f.value, locale)}, ${runBy}`}
        className={`inline-flex flex-col items-end font-medium underline-offset-2 hover:underline ${TAP_TARGET_MIN_CLASS}`}
      >
        <span>{formatPercent(f.value, locale)}</span>
        <span data-testid="ai-bench-score-operator" className="text-xs font-normal text-muted-foreground">
          {op.shortName}
        </span>
      </a>
    </td>
  );
}

function Row({ s, locale }: { s: TableRow; locale: Locale }) {
  const { model } = s;
  const blended = blendedPrice(model.price);
  const rateLabel = listedRateLabel(model.price, locale);
  const notes = [...(rateLabel === undefined ? [] : [rateLabel]), ...modelNotes(model, locale)];
  return (
    <tr data-testid="ai-bench-table-row" data-model-id={model.id} data-tier={s.tier} className="border-b last:border-0">
      <th scope="row" className={`${TD} ${PINNED} min-w-36 bg-background text-left font-normal sm:min-w-48`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{model.name}</span>
          <LimitedChip model={model} locale={locale} />
        </div>
        <div className="text-xs text-muted-foreground">{model.vendor}</div>
        {notes.map((n) => (
          <div key={n} className="mt-1 max-w-48 text-xs text-muted-foreground sm:max-w-64">
            {n}
          </div>
        ))}
      </th>
      <td className={`${TD} whitespace-nowrap`} data-testid="ai-bench-table-tier">
        {tierCell(s.tier, locale)}
      </td>
      {BENCHMARK_SPECS.map((b) => (
        <ScoreCell key={b.id} model={model} benchmark={b} locale={locale} />
      ))}
      <td className={NUM} data-testid="ai-bench-table-input">
        {model.price === undefined ? DASH : formatUsd(model.price.input, locale)}
      </td>
      <td className={NUM} data-testid="ai-bench-table-output">
        {model.price === undefined ? DASH : formatUsd(model.price.output, locale)}
      </td>
      <td className={NUM} data-testid="ai-bench-table-blended">
        {blended === undefined ? DASH : formatUsd(blended, locale)}
      </td>
      <td className={NUM} data-testid="ai-bench-table-cost">
        {model.costPerTask === undefined ? DASH : formatUsd(model.costPerTask.usd, locale)}
      </td>
      <td className={`${TD} min-w-40 text-xs`} data-testid="ai-bench-table-harnesses">
        {model.harnesses.length === 0 ? DASH : model.harnesses.map((h) => HARNESS_DISPLAY_NAMES[h]).join(", ")}
      </td>
    </tr>
  );
}

export function ModelTable({ rows, locale }: ModelTableProps) {
  const ordered = [...rows].sort(tableOrder);
  return (
    // Not a labelled section: the scroll region below carries the heading as its name, and a
    // second landmark with the same name would be ambiguous to screen-reader users.
    <div data-testid="ai-bench-table-section" className="space-y-2">
      <h2 id="ai-bench-table-heading" className="text-xl font-semibold">
        {t(locale, "aiBenchTableHeading")}
      </h2>
      <p className="text-xs text-muted-foreground">{t(locale, "aiBenchTableScrollHint")}</p>
      <div
        role="region"
        aria-labelledby="ai-bench-table-heading"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <table data-testid="ai-bench-table" className="w-full text-sm">
          <caption className="px-3 py-2 text-left text-xs text-muted-foreground">
            {t(locale, "aiBenchTableCaption")}
          </caption>
          <thead className="border-b bg-muted">
            <tr>
              <th scope="col" className={`${TH} ${PINNED} bg-muted`}>
                {t(locale, "aiBenchColModel")}
              </th>
              <th scope="col" className={TH}>
                {t(locale, "aiBenchColTier")}
              </th>
              {BENCHMARK_SPECS.map((b) => (
                <th key={b.id} scope="col" className={`${TH} text-right`}>
                  {b.name} <span className="font-normal">{b.version}</span>
                </th>
              ))}
              <th scope="col" className={`${TH} text-right`}>
                {t(locale, "aiBenchColInput")}
              </th>
              <th scope="col" className={`${TH} text-right`}>
                {t(locale, "aiBenchColOutput")}
              </th>
              <th scope="col" className={`${TH} text-right`}>
                {t(locale, "aiBenchColBlended")}
              </th>
              <th scope="col" className={`${TH} text-right`}>
                {t(locale, "aiBenchColCostPerTask")}
              </th>
              <th scope="col" className={TH}>
                {t(locale, "aiBenchColHarnesses")}
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((s) => (
              <Row key={s.model.id} s={s} locale={locale} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
