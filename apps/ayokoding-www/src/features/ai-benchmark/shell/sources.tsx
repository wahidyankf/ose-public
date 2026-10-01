// AI BENCHMARK — every benchmark operator and price page, with the date each was last checked.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { OPERATORS, PRICE_SOURCES } from "../core/data/operators";
import { formatDate, tf } from "./format";
import { TAP_TARGET_MIN_CLASS } from "./tap-target";

const LINK = `inline-flex items-center font-medium underline underline-offset-2 ${TAP_TARGET_MIN_CLASS}`;

export function Sources({ locale }: { locale: Locale }) {
  return (
    <section aria-labelledby="ai-bench-sources-heading" data-testid="ai-bench-sources" className="space-y-3 text-sm">
      <h2 id="ai-bench-sources-heading" className="text-xl font-semibold">
        {t(locale, "aiBenchSourcesHeading")}
      </h2>
      <h3 className="font-semibold">{t(locale, "aiBenchSourcesBenchmarks")}</h3>
      <ul className="space-y-1">
        {OPERATORS.map((o) => (
          <li key={o.id} data-testid="ai-bench-source-operator" data-operator-id={o.id}>
            <a href={o.url} target="_blank" rel="noopener noreferrer" className={LINK}>
              {o.name}
            </a>
            <span className="text-muted-foreground">
              {" — "}
              {tf(locale, "aiBenchSourcesChecked", { date: formatDate(o.checkedOn, locale) })}
              {o.sourceUpdated !== undefined &&
                `; ${tf(locale, "aiBenchSourcesUpdated", { date: formatDate(o.sourceUpdated, locale) })}`}
              {"; "}
              <span data-testid="ai-bench-source-cited">{t(locale, "aiBenchSourcesCitedAs")}</span>
            </span>
          </li>
        ))}
      </ul>
      <p data-testid="ai-bench-sources-citation" className="text-muted-foreground">
        {t(locale, "aiBenchSourcesCitation")}
      </p>
      <h3 className="font-semibold">{t(locale, "aiBenchSourcesPrices")}</h3>
      <ul className="space-y-1">
        {PRICE_SOURCES.map((p) => (
          <li key={p.name} data-testid="ai-bench-source-price">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className={LINK}>
              {p.name}
            </a>
            <span className="text-muted-foreground">
              {" — "}
              {tf(locale, "aiBenchSourcesChecked", { date: formatDate(p.checkedOn, locale) })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
