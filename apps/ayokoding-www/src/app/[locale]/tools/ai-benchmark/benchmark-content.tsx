"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/features/i18n/shell/use-locale";
import { t } from "@/features/i18n/core/translations";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import type { Dataset } from "@/features/ai-benchmark/core/data/types";
import { filterModels } from "@/features/ai-benchmark/core/filter";
import { frontierModels } from "@/features/ai-benchmark/core/substitute";
import { computeTierGroups, scoreModels, tierAnchors } from "@/features/ai-benchmark/core/tiers";
import { decodeState, encodeState, type UrlState } from "@/features/ai-benchmark/core/url-state";
import { BenchmarkFilters } from "@/features/ai-benchmark/shell/benchmark-filters";
import { formatDate } from "@/features/ai-benchmark/shell/format";
import { InsufficientList } from "@/features/ai-benchmark/shell/insufficient-list";
import { METHODOLOGY_ID, Methodology } from "@/features/ai-benchmark/shell/methodology";
import { ModelTable } from "@/features/ai-benchmark/shell/model-table";
import { Sources } from "@/features/ai-benchmark/shell/sources";
import { SubstituteFinder } from "@/features/ai-benchmark/shell/substitute-finder";
import { TAP_TARGET_MIN_CLASS } from "@/features/ai-benchmark/shell/tap-target";
import { RATED_TIERS, TierMap } from "@/features/ai-benchmark/shell/tier-map";

const FRONTIER_IDS = new Set(frontierModels(dataset).map((m) => m.id));

function openMethodology() {
  const el = document.getElementById(METHODOLOGY_ID);
  if (el instanceof HTMLDetailsElement) el.open = true;
}

export function BenchmarkContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // The URL is the single source of truth for the filters and the finder's target.
  const state = decodeState(searchParams, (id) => FRONTIER_IDS.has(id));
  const shown: Dataset = { ...dataset, models: filterModels(dataset, state, dataset) };
  const isEmpty = shown.models.length === 0;
  // Tiers are always judged against the full roster's anchors, so filtering never moves a model.
  const groups = computeTierGroups(shown, dataset);
  const tiers = state.tier === undefined ? RATED_TIERS : RATED_TIERS.filter((tier) => tier === state.tier);

  // `router.push` is asynchronous: two quick changes would both merge onto the same stale render
  // state and the second would drop the first. The ref is updated synchronously in `navigate` and
  // re-synced from the URL on every render (so back/forward is reflected).
  const latest = useRef<UrlState>(state);
  latest.current = state;

  function navigate(patch: Partial<UrlState>) {
    const next: UrlState = { ...latest.current, ...patch };
    latest.current = next;
    const qs = encodeState(next).toString();
    // In-page state, not a page change: keep the reader where they are.
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div data-testid="ai-bench-page" className="mx-auto max-w-6xl space-y-6 px-4 py-4 sm:py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t(locale, "aiBenchTitle")}</h1>
        <p data-testid="ai-bench-subtitle" className="text-muted-foreground">
          {t(locale, "aiBenchSubtitle")}
        </p>
        <p data-testid="ai-bench-last-updated" className="text-sm font-medium">
          {t(locale, "aiBenchLastUpdatedLabel")}:{" "}
          <time dateTime={dataset.lastUpdated}>{formatDate(dataset.lastUpdated, locale)}</time>
        </p>
        <p data-testid="ai-bench-independent-only" className="text-sm text-muted-foreground">
          {t(locale, "aiBenchIndependentOnly")}{" "}
          <a
            href={`#${METHODOLOGY_ID}`}
            onClick={openMethodology}
            className={`inline-flex items-center font-medium text-foreground underline underline-offset-2 ${TAP_TARGET_MIN_CLASS}`}
          >
            {t(locale, "aiBenchJumpToMethod")}
          </a>
        </p>
      </header>

      <SubstituteFinder
        dataset={dataset}
        selectedId={state.sub}
        locale={locale}
        onSelect={(sub) => navigate({ sub })}
      />

      <BenchmarkFilters
        state={state}
        shownCount={shown.models.length}
        totalCount={dataset.models.length}
        locale={locale}
        onChange={navigate}
      />

      {isEmpty ? (
        <p
          data-testid="ai-bench-empty-state"
          role="status"
          className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          <span className="mb-1 block font-medium text-foreground">{t(locale, "aiBenchEmptyStateTitle")}</span>
          {t(locale, "aiBenchEmptyStateMessage")}
        </p>
      ) : (
        <>
          {tiers.length > 0 && <TierMap groups={groups} anchors={tierAnchors(dataset)} tiers={tiers} locale={locale} />}
          <InsufficientList models={groups.insufficient} locale={locale} />
          <ModelTable rows={scoreModels(shown, dataset)} locale={locale} />
        </>
      )}

      <Methodology dataset={dataset} locale={locale} />
      <Sources locale={locale} />
    </div>
  );
}
