import { useSettings } from "@/contexts/settings/presentation";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";
import { TRANSLATIONS } from "./translations";
import type { TranslationKey } from "./translations";

export function useT(runtime: JournalRuntime) {
  const { state } = useSettings(runtime);
  const lang = state.status === "ready" ? state.settings.lang : "en";

  return function t(key: TranslationKey): string {
    return (TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key) as string;
  };
}
