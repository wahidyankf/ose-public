import { t } from "./translations";
import type { Locale } from "./config";

/** Fill `{name}` placeholders in a translated template. Unknown placeholders are left as-is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/** Translate `key` and fill its placeholders. */
export function tf(locale: Locale, key: string, values: Record<string, string | number>): string {
  return fill(t(locale, key), values);
}
