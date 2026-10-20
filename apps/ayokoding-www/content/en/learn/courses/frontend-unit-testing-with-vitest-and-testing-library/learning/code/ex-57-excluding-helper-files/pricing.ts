import { fixtureName } from "./helpers";
// => Product code imports the helper: exclusion does not break imports.
// => Coverage measures EXECUTION: the helper runs, it just is not scored.

export function label(base: string): string {
  // => Tiny product function: the table below scores ONLY this file.
  return fixtureName(base).toUpperCase();
  // => Helper plus transform: one line, fully tested, 100 percent honest.
}
