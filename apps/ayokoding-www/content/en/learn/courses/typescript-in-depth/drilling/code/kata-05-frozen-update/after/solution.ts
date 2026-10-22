// => Kata 5 solution: readonly shape plus spread updates; the original never mutates.
export interface Config {
  // => locked shape
  readonly host: string; // => set at creation
  readonly retries: number; // => set at creation
} // => end of export interface Config
export const defaults: Config = { host: "localhost", retries: 3 }; // => frozen by type
export function withRetries(base: Config, n: number): Config {
  // => update returns new
  return { ...base, retries: n }; // => WHY spread: copy with one field changed
} // => end of export function withRetries(base: Config, n: number)
const custom = withRetries(defaults, 9); // => derive without touching defaults
console.log(custom.retries, defaults.retries); // => Output: 9 3, original kept
console.log(custom.host); // => Output: localhost
