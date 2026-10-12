/**
 * Fill `{name}` placeholders in a translated template. Unknown placeholders are left as-is.
 *
 * Course-paths-local equivalent of the benchmark shell's `fill` (kept local so this feature
 * does not depend on another feature's shell): single-pass, so a value that itself contains
 * braces is never re-scanned.
 */
export function formatTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}
