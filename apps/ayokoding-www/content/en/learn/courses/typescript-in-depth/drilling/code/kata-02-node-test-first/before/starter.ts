// => Kata 2 starter: untested helper with a quantity bug hiding inside.
export interface Line {
  // => order line shape
  price: number; // => unit price
  qty: number; // => units ordered
} // => end of export interface Line
export function total(lines: Line[]): number {
  // => BUG: sums prices, ignores qty
  return lines.reduce((n, l) => n + l.price, 0); // => wrong: qty never multiplied
} // => end of export function total(lines: Line[]): number
