// AI BENCHMARK — harness and tier filters. A controlled view over the URL-held FilterState: every
// option comes from the core's known-value lists, so a new harness or tier needs no edit here.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { HARNESS_DISPLAY_NAMES, TIERS } from "../core/data/benchmarks";
import { HARNESS_IDS, isKnownHarness, isKnownTier, type FilterState } from "../core/filter";
import { tf } from "./format";
import { SelectField } from "./select-field";
import { tierLabel } from "./tier-style";

export type BenchmarkFiltersProps = {
  state: FilterState;
  shownCount: number;
  totalCount: number;
  locale: Locale;
  onChange: (patch: Partial<FilterState>) => void;
};

export function BenchmarkFilters({ state, shownCount, totalCount, locale, onChange }: BenchmarkFiltersProps) {
  const active = state.harness !== undefined || state.tier !== undefined;
  return (
    <section aria-labelledby="ai-bench-filters-heading" data-testid="ai-bench-filters" className="space-y-3">
      <h2 id="ai-bench-filters-heading" className="sr-only">
        {t(locale, "aiBenchFilterHeading")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <SelectField
          id="ai-bench-filter-harness"
          label={t(locale, "aiBenchFilterHarness")}
          value={state.harness ?? ""}
          emptyLabel={t(locale, "aiBenchFilterHarnessAll")}
          options={HARNESS_IDS.map((h) => ({ value: h, label: HARNESS_DISPLAY_NAMES[h] }))}
          onChange={(v) => onChange({ harness: isKnownHarness(v) ? v : undefined })}
        />
        <SelectField
          id="ai-bench-filter-tier"
          label={t(locale, "aiBenchFilterTier")}
          value={state.tier ?? ""}
          emptyLabel={t(locale, "aiBenchFilterTierAll")}
          options={TIERS.map((tier) => ({ value: tier, label: tierLabel(tier, locale) }))}
          onChange={(v) => onChange({ tier: isKnownTier(v) ? v : undefined })}
        />
        <button
          type="button"
          data-testid="ai-bench-filter-reset"
          disabled={!active}
          onClick={() => {
            onChange({ harness: undefined, tier: undefined });
            // Reset disables itself once nothing is filtered; hand focus to the first filter so a
            // keyboard user is not dropped back to the top of the document.
            document.getElementById("ai-bench-filter-harness")?.focus();
          }}
          className="h-11 rounded-md border border-input px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1"
        >
          {t(locale, "aiBenchFilterReset")}
        </button>
      </div>
      <p data-testid="ai-bench-result-count" role="status" className="text-sm text-muted-foreground">
        {tf(locale, "aiBenchFilterResultCount", { count: shownCount, total: totalCount })}
      </p>
    </section>
  );
}
