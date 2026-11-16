// AI BENCHMARK — models whose tiered benchmarks do not agree on one tier. Rated on at least
// two benchmarks, but the modal tier holds fewer than half of them, so they have no consensus
// tier and appear in no tier section. A closed disclosure beside (never inside) the
// insufficient-data one, reusing its row rendering.

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import type { ConsensusModel } from "../core/tiers";
import { tf } from "./format";
import { TierlessModelItem } from "./insufficient-list";

export type NoConsensusListProps = {
  models: readonly ConsensusModel[];
  locale: Locale;
};

export function NoConsensusList({ models, locale }: NoConsensusListProps) {
  if (models.length === 0) return null;
  const sorted = [...models].sort((a, b) => a.model.name.localeCompare(b.model.name));
  return (
    <details data-testid="ai-bench-no-consensus" className="rounded-lg border bg-card">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-semibold">
        <h2 className="text-base">{tf(locale, "aiBenchNoConsensusHeading", { count: models.length })}</h2>
      </summary>
      <div className="space-y-2 border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">{t(locale, "aiBenchNoConsensusIntro")}</p>
        <ul className="divide-y">
          {sorted.map((s) => (
            <TierlessModelItem
              key={s.model.id}
              s={s}
              locale={locale}
              itemTestId="ai-bench-no-consensus-item"
              scoresTestId="ai-bench-no-consensus-scores"
            />
          ))}
        </ul>
      </div>
    </details>
  );
}
