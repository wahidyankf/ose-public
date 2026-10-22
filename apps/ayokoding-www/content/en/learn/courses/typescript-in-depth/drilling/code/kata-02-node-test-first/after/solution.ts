// => Kata 2 solution file 1: the fixed helper multiplies before it sums.
export interface Line {
  // => order line shape
  price: number; // => unit price
  qty: number; // => units ordered
} // => end of export interface Line
export function total(lines: Line[]): number {
  // => fixed: every line contributes price times qty
  return lines.reduce((n, l) => n + l.price * l.qty, 0); // => qty honored
} // => end of export function total(lines: Line[]): number
