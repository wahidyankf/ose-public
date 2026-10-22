// => Example 26 file 1: named exports share pure helpers; main imports them.
export function area(radius: number): number {
  // => circle area from a radius
  return Math.PI * radius * radius; // => pi r squared
} // => end of export function area(radius: number): number
export function perimeter(radius: number): number {
  // => circle perimeter from a radius
  return 2 * Math.PI * radius; // => two pi r
} // => end of export function perimeter(radius: number): number
export const UNIT = "cm"; // => shared unit label
