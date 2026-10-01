// AI BENCHMARK — small pieces shared by every section that names a model.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import type { Model } from "../core/data/types";
import { formatUsd, tf } from "./format";
import { noteText } from "./note-text";

const CHIP = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

/** "Limited access" chip, with the model's note as its accessible description. */
export function LimitedChip({ model, locale }: { model: Model; locale: Locale }) {
  if (model.access !== "limited") return null;
  return (
    <span
      data-testid="ai-bench-limited"
      title={model.note === undefined ? undefined : noteText(model.note, locale)}
      className={`${CHIP} border-dashed text-muted-foreground`}
    >
      {t(locale, "aiBenchLimitedAccess")}
    </span>
  );
}

/** The model's own note and its price note, in the reader's language. */
export function modelNotes(model: Model, locale: Locale): string[] {
  return [model.note, model.price?.note].filter((n): n is string => n !== undefined).map((n) => noteText(n, locale));
}

export function AnchorChip({ locale }: { locale: Locale }) {
  return <span className={`${CHIP} bg-muted`}>{t(locale, "aiBenchAnchorBadge")}</span>;
}

/** "$4.00 / $20.00 per 1M tokens", flagged when the rate is OpenCode's; or "No public API price". */
export function PriceText({ model, locale }: { model: Model; locale: Locale }) {
  const p = model.price;
  if (p === undefined) return <span data-testid="ai-bench-price">{t(locale, "aiBenchNoPrice")}</span>;
  return (
    <span data-testid="ai-bench-price">
      {tf(locale, "aiBenchPriceInOut", { input: formatUsd(p.input, locale), output: formatUsd(p.output, locale) })}
      {p.listedBy === "opencode" ? ` (${t(locale, "aiBenchOpencodeRate")})` : ""}
    </span>
  );
}
