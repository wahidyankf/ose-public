// => Kata 4 starter: any silences the compiler; wrong shapes explode at runtime.
export function areaOf(raw: any): number {
  // => BUG: any trusts every caller
  return Math.PI * raw.r * raw.r; // => explodes when r is missing
} // => end of export function areaOf(raw: any): number
