// AI BENCHMARK — presentation formatting. Pure presenters: every value comes from the dataset or
// the core; the `%`, `$`, and `×` symbols are formatting, not data.

import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";

function localeTag(locale: Locale): string {
  return locale === "id" ? "id-ID" : "en-US";
}

// Two locales only, so each cache holds at most two formatters; constructing `Intl` formatters is
// far costlier than reusing them across the few hundred cells a page renders.
const cache = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: Locale, kind: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${kind}:${locale}`;
  let f = cache.get(key);
  if (f === undefined) {
    f = new Intl.NumberFormat(localeTag(locale), options);
    cache.set(key, f);
  }
  return f;
}

/** A composite index, one decimal. */
export function formatIndex(value: number, locale: Locale): string {
  return numberFormat(locale, "index", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** A 0–100 benchmark score, one decimal, with a literal percent sign (no Intl double-scaling). */
export function formatPercent(value: number, locale: Locale): string {
  return `${formatIndex(value, locale)}%`;
}

/** USD, two to three decimals so sub-cent rates such as $0.435 stay exact. */
export function formatUsd(value: number, locale: Locale): string {
  return numberFormat(locale, "usd", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value);
}

/** A price multiple: one decimal below 10, whole numbers above. */
export function formatRatio(value: number, locale: Locale): string {
  const digits = value < 10 ? 1 : 0;
  return numberFormat(locale, `ratio${digits}`, { maximumFractionDigits: digits }).format(value);
}

/**
 * An ISO date as a long, localized date. Pinned to UTC: the ISO date parses as UTC midnight, so
 * any other zone would show the previous day west of Greenwich and break hydration.
 */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// `fill`/`tf` live in the i18n core (plan 03) so every feature can fill placeholders;
// re-exported here so the existing ai-benchmark imports keep working.
export { fill, tf } from "@/features/i18n/core/fill";
import { tf } from "@/features/i18n/core/fill";

/** Ratios within this band of 1 read as "about the same price". */
const SAME_PRICE_BAND = 0.05;

/** Is a candidate clearly cheaper than its reference (outside the "about the same" band)? */
export function isCheaper(ratio: number | undefined): boolean {
  return ratio !== undefined && ratio < 1 - SAME_PRICE_BAND;
}

/**
 * How a candidate's price compares with a reference's, given `ratio` = candidate ÷ reference
 * (from `core/price.ts`'s `priceRatio`).
 */
export function priceComparison(ratio: number | undefined, locale: Locale): string {
  if (ratio === undefined || ratio === 0) return t(locale, "aiBenchPriceUnknown");
  if (Math.abs(ratio - 1) <= SAME_PRICE_BAND) return t(locale, "aiBenchPriceSame");
  return ratio < 1
    ? tf(locale, "aiBenchPriceCheaper", { ratio: formatRatio(1 / ratio, locale) })
    : tf(locale, "aiBenchPricePricier", { ratio: formatRatio(ratio, locale) });
}
