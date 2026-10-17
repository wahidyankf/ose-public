"use client";

import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { useLearningProgress } from "./use-learning-progress";

/**
 * The one-line notice for a reader whose browser refuses to persist progress (plan 04,
 * tech-docs/004). It renders inside a fixed `h-5` slot, so showing or hiding it moves nothing
 * below it (S8).
 */
export function StorageNotice({ locale }: { locale: string }) {
  const snapshot = useLearningProgress();
  const unavailable = snapshot.status === "ready" && !snapshot.persisted;

  return (
    <p data-progress-slot="storage-notice" className="h-5 text-sm text-muted-foreground">
      {unavailable ? t(locale as Locale, "progressStorageUnavailable") : null}
    </p>
  );
}
