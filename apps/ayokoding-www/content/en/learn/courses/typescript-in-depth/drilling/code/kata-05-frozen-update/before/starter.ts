// => Kata 5 starter: shared config mutated in place; callers see each other's edits.
export interface Config {
  // => mutable shape
  host: string; // => where
  retries: number; // => attempts
} // => end of export interface Config
export const defaults: Config = { host: "localhost", retries: 3 }; // => BUG: shared mutable singleton
export function withRetries(n: number): Config {
  // => BUG: mutates the singleton
  defaults.retries = n; // => every caller sees this edit
  return defaults; // => same reference out
} // => end of export function withRetries(n: number): Config
