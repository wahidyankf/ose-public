// => Kata 6 starter: three getters differing only by type; the next type needs a fourth.
export function getString(obj: Record<string, string>, key: string): string {
  // => string-only getter
  return obj[key] ?? ""; // => default when missing
} // => end of export function getString(obj: Record<string, string
export function getNumber(obj: Record<string, number>, key: string): number {
  // => number-only twin
  return obj[key] ?? 0; // => duplicated shape
} // => end of export function getNumber(obj: Record<string, number
export function getFlag(obj: Record<string, boolean>, key: string): boolean {
  // => boolean-only triplet
  return obj[key] ?? false; // => third copy of one idea
} // => end of export function getFlag(obj: Record<string, boolean>
