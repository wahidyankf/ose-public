// => Example 66: declarations let JavaScript consumers use typed packages.
export interface Point {
  // => exported shape lands in the .d.ts
  x: number; // => coordinate
  y: number; // => coordinate
} // => end of export interface Point
export function origin(): Point {
  // => exported helper lands in the .d.ts
  return { x: 0, y: 0 }; // => the origin
} // => end of export function origin(): Point
console.log(JSON.stringify(origin())); // => Output: {"x":0,"y":0}
