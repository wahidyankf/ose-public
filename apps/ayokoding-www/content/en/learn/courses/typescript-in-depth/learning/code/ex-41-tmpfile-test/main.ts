/// <reference path="./node.d.ts" />
// => Example 41 file 1: a two-line file store: save joins rows, load splits them.
import { writeFileSync, readFileSync } from "node:fs"; // => file primitives
export function save(path: string, rows: string[]): void {
  // => writes rows plus trailer
  writeFileSync(path, rows.join("\n") + "\n"); // => newline-joined with trailer
} // => end of export function save(path: string, rows: string[]):
export function load(path: string): string[] {
  // => reads rows back
  return readFileSync(path, "utf-8")
    .split("\n")
    .filter((l) => l !== ""); // => trailer cut
} // => end of export function load(path: string): string[]
