// AI BENCHMARK — tier labels and colour classes. Colours resolve through the `--chart-tier-*`
// tokens in `libs/web-ui-token/src/ayokoding.css`; no component names a hue directly. Each class is
// a complete literal string because Tailwind's scanner cannot see classes built at runtime.

import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";
import type { Tier } from "../core/data/types";

const LABEL_KEYS: Record<Tier, string> = {
  ultra: "aiBenchTierUltra",
  planning: "aiBenchTierPlanning",
  execution: "aiBenchTierExecution",
  fast: "aiBenchTierFast",
  insufficient: "aiBenchTierInsufficient",
};

const USE_KEYS: Record<Exclude<Tier, "insufficient">, string> = {
  ultra: "aiBenchTierUltraUse",
  planning: "aiBenchTierPlanningUse",
  execution: "aiBenchTierExecutionUse",
  fast: "aiBenchTierFastUse",
};

/** Background colour for a tier's bar fill and swatch. */
export const TIER_BG_CLASS: Record<Tier, string> = {
  ultra: "bg-[var(--chart-tier-ultra)]",
  planning: "bg-[var(--chart-tier-planning)]",
  execution: "bg-[var(--chart-tier-execution)]",
  fast: "bg-[var(--chart-tier-fast)]",
  insufficient: "bg-[var(--chart-tier-insufficient)]",
};

/** Left-border accent for a tier section. */
export const TIER_BORDER_CLASS: Record<Tier, string> = {
  ultra: "border-l-[var(--chart-tier-ultra)]",
  planning: "border-l-[var(--chart-tier-planning)]",
  execution: "border-l-[var(--chart-tier-execution)]",
  fast: "border-l-[var(--chart-tier-fast)]",
  insufficient: "border-l-[var(--chart-tier-insufficient)]",
};

export function tierLabel(tier: Tier, locale: Locale): string {
  return t(locale, LABEL_KEYS[tier]);
}

export function tierUse(tier: Exclude<Tier, "insufficient">, locale: Locale): string {
  return t(locale, USE_KEYS[tier]);
}

/** A small coloured dot before a tier name. Decorative: the name beside it carries the meaning. */
export function TierSwatch({ tier }: { tier: Tier }) {
  return (
    <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${TIER_BG_CLASS[tier]}`} />
  );
}
