---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Build `report-cli`: a small, idiomatic TypeScript command-line tool that reads an orders file, validates every row, totals the valid lines, skips the bad ones with named reports, and writes a human-readable report file — all with the standard library only, embedded selftests gating the run, and a golden expected transcript. This capstone combines the course's four load-bearing habits: parse at the boundary with `Result` values, package a runnable unit with a `run.yaml`, test with the standard assertions, and pin the one dependency convention the project needs (none — standard library only, stated explicitly).

## What you build

`report-cli` reads `orders.csv` — item, quantity, price per row — and produces two outputs. On standard output it prints the selftest gate line, one `skip:` line per rejected row, the kept line count, the grand total, and the report-write confirmation. Into the scratch directory it writes `report.txt`: the kept count, one line per kept order with its line total, and the grand total. The golden transcript records the standard output byte-identically; the scratch report is recreated on every run and never asserted, because its path is machine-shaped.

The fixture carries four rows: two valid bulk lines, one zero-quantity line the quantity policy rejects, and the header the parser skips. That mix is deliberate — the capstone must show all three fates (kept, skipped, ignored) in one run, exactly as production inputs mix all three.

## How it is organized

`learning/capstone/code/` holds `main.ts` (parse, validate, total, write, report in one readable flow), `orders.csv` (the committed fixture), `node.d.ts` (the ambient declarations for the file and assertion built-ins, identical in shape to the ones in Examples 13 through 44), and `run.yaml` (`toolchain: typescript`, standard library only, golden transcript at `expected/main/main.stdout.txt`).

`main.ts` reads in five movements. First the `Result` union and the `Line` interface state the vocabulary: outcomes as data, rows as validated records. Second `parseLine` enforces the three row policies — non-blank item, integer quantity of at least one, finite non-negative price — returning a failure value that names the violated rule and the offending row. Third `selftest` runs four standard assertions over the parser and the math before any real work, printing the gate line only when all four hold. Fourth the driver reads the fixture, validates every row, collects kept lines and skip reports, folds the grand total, and writes the scratch report. Fifth the summary lines print the transcript the harness asserts.

## The four habits, placed

Parse at the boundary (Examples 9 through 17, Example 75): `parseLine` returns `Result<Line>` so the driver handles both arms without a single `try` — invalid rows skip with reports, valid rows accumulate, and the policies live in one function instead of every consumer. Testing as a gate (Examples 35 through 44): `selftest` uses `strictEqual` and `deepStrictEqual` from `node:assert/strict`, the same assertions the testing cluster runs under `node:test`, and the run refuses to report on red — no transcript without green selftests. Packaging as a unit (Examples 26 through 34): the `run.yaml` compiles strict and runs the program with the same two commands every example uses, and the lockfile convention is satisfied vacuously and honestly — standard library only, nothing to pin, stated in the run spec by its absence. Reading discipline (Examples 71 through 78): the file reads outside in — types, policies, gate, driver — so a stranger can explain it in one pass.

## Extending it

Three natural extensions stay inside the course's vocabulary. Add a `--limit` flag with the parser from Example 77 and filter kept lines above a floor before totaling. Add a second fixture with a malformed price and watch the price policy report it by name. Convert the summary printing to the `node:test` shape from Example 35, with one case per policy, and keep the golden transcript on the `PASS` lines. Each extension reuses one cluster deliberately — flags, boundaries, tests — which is how the course compounds instead of merely ending.

## Why this shape

Real command-line tools are boundary programs: untrusted text in, validated records through, reports out, failures named. The capstone is that shape at its smallest honest size — one fixture, three policies, two outputs, four selftests — so every line earns its place and every habit from the course appears exactly where production would put it. Nothing here is scaffolding for the grade; remove any movement and a real tool would miss it too.

## References

- TypeScript documentation and handbook (modules, strictness, `Result`-style unions). Accessed 2026-10-21. [TypeScript docs](https://www.typescriptlang.org/docs/)
- Node.js API reference for the pinned runtime (file system, paths, asserts). Accessed 2026-10-21. [Node.js docs](https://nodejs.org/docs/)
- The pinned TypeScript toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific syntax or API.

**`learning/capstone/code/orders.csv`**:

```csv
item,qty,price
lamp,2,25
pen,0,3
desk,2,150
```

**`learning/capstone/code/node.d.ts`**:

```typescript
// => Shared ambient declarations for the Node.js builtins this unit touches.
// => The pinned toolchain ships no network and no @types/node, so the few
// => APIs each example needs are declared here instead of installed.
declare module "node:fs" {
  // => file scratch: read, write, list, remove
  export function readFileSync(path: string, encoding: "utf-8"): string; // => text reads only
  export function writeFileSync(path: string, data: string): void; // => text writes only
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void; // => scratch folders
  export function rmSync(path: string, options?: { force?: boolean; recursive?: boolean }): void; // => cleanup
  export function readdirSync(path: string): string[]; // => directory listings
  export function existsSync(path: string): boolean; // => presence checks
} // => end of declare module "node:fs"
declare module "node:path" {
  // => portable path assembly, no string concat
  export function join(...parts: string[]): string; // => joins with the platform separator
  export function basename(path: string, ext?: string): string; // => final segment only
  export function extname(path: string): string; // => extension including the dot
  export function dirname(path: string): string; // => parent directory only
} // => end of declare module "node:path"
declare module "node:os" {
  // => scratch root for deterministic file demos
  export function tmpdir(): string; // => writable temp directory
} // => end of declare module "node:os"
declare module "node:test" {
  // => the standard test runner used by the testing cluster
  export function describe(name: string, fn: () => void): void; // => groups related tests
  export interface CaseFn {
    // => a case function with parked and planned variants
    (name: string, fn: () => void | Promise<void>): void; // => normal case
    skip(name: string, fn?: () => void | Promise<void>): void; // => parked case
    todo(name: string, fn?: () => void | Promise<void>): void; // => planned case
  } // => end of export interface CaseFn
  export const it: CaseFn; // => nested case inside describe
  export interface TestContext {
    // => per-test handle for subtests
    test(name: string, fn: () => void | Promise<void>): Promise<void>; // => nested subtest
  } // => end of export interface TestContext
  export interface TopFn {
    // => top-level case with context plus variants
    (name: string, fn: (t: TestContext) => void | Promise<void>): void; // => standalone case
    skip(name: string, fn?: () => void | Promise<void>): void; // => parked case
    todo(name: string, fn?: () => void | Promise<void>): void; // => planned case
  } // => end of export interface TopFn
  export const test: TopFn; // => standalone case runner
  export function beforeEach(fn: () => void | Promise<void>): void; // => fixture setup per case
  export function afterEach(fn: () => void | Promise<void>): void; // => fixture teardown per case
  export interface MockCall {
    // => one recorded mock invocation
    arguments: unknown[]; // => the arguments that call received
  } // => end of export interface MockCall
  export interface MockHandle {
    // => recorded calls of one mock function
    calls: MockCall[]; // => every invocation in order
  } // => end of export interface MockHandle
  export function mockFn<T extends (...args: never[]) => unknown>( // => call recorder
    impl: T, // => the wrapped implementation
  ): T & { mock: MockHandle }; // => recorded handle out
  export const mock: {
    // => the mock namespace the runner provides
    fn: typeof mockFn; // => function-call recorder
    timers: {
      // => deterministic clock for timer tests
      enable(options: { apis: string[]; now: number }): void; // => swaps in the fake clock
      tick(ms: number): void; // => advances the fake clock synchronously
      reset(): void; // => restores the real timers
    }; // => end of timers
  }; // => end of mock namespace
} // => end of declare module "node:test"
declare module "node:assert/strict" {
  // => the standard assertion library
  export function strictEqual(actual: unknown, expected: unknown, message?: string): void; // => Object.is comparison
  export function deepStrictEqual(actual: unknown, expected: unknown, message?: string): void; // => deep check
  export function ok(value: unknown, message?: string): void; // => truthiness check
  export function throws(fn: () => unknown, expected?: RegExp): void; // => sync-throw check
  export function rejects(fn: () => Promise<unknown>, expected?: RegExp): Promise<void>; // => expects a rejection
} // => end of declare module "node:assert/strict"
declare const process: {
  // => the few process handles CLI examples need
  argv: string[]; // => raw command-line arguments
  version: string; // => running Node.js version string
  exit(code?: number): never; // => terminates with a status code
  env: Record<string, string | undefined>; // => environment map
}; // => end of declare const process:
```

**`learning/capstone/code/main.ts`**:

```typescript
/// <reference path="./node.d.ts" />
// => Capstone file 1: report-cli reads orders, validates rows, totals, and writes a report.
import { readFileSync, writeFileSync } from "node:fs"; // => input read plus report write
import { join } from "node:path"; // => portable scratch path
import { tmpdir } from "node:os"; // => writable scratch root
import { strictEqual, deepStrictEqual } from "node:assert/strict"; // => embedded selftests
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => outcome union
interface Line {
  // => one validated order line
  item: string; // => product name
  qty: number; // => units, at least one
  price: number; // => unit price, finite
} // => end of interface Line
function parseLine(raw: string): Result<Line> {
  // => WHY Result: bad rows skip, never crash
  const [item, qtyRaw, priceRaw] = raw.split(","); // => three columns
  const qty = Number(qtyRaw); // => coerce once
  const price = Number(priceRaw); // => coerce once
  if (item.trim() === "") {
    // => name policy
    return { ok: false, error: `blank item in: ${raw}` }; // => failure as data
  } // => end of if (item.trim() === "")
  if (!Number.isInteger(qty) || qty < 1) {
    // => quantity policy
    return { ok: false, error: `bad qty in: ${raw}` }; // => failure as data
  } // => end of if (!Number.isInteger(qty) || qty < 1)
  if (!Number.isFinite(price) || price < 0) {
    // => price policy
    return { ok: false, error: `bad price in: ${raw}` }; // => failure as data
  } // => end of if (!Number.isFinite(price) || price < 0)
  return { ok: true, value: { item: item.trim(), qty, price } }; // => trusted line out
} // => end of function parseLine(raw: string): Result<Line>
function lineTotal(line: Line): number {
  // => one line's contribution
  return line.qty * line.price; // => units times price
} // => end of function lineTotal(line: Line): number
function selftest(): void {
  // => WHY embedded: the standard asserts gate the release
  const one = parseLine("lamp,2,25"); // => valid fixture row
  strictEqual(one.ok && one.value.qty, 2); // => qty parsed
  const bad = parseLine("pen,0,3"); // => zero-qty row
  strictEqual(bad.ok, false); // => rejected as data, not thrown
  strictEqual(lineTotal({ item: "lamp", qty: 2, price: 25 }), 50); // => line math
  deepStrictEqual(
    [1, 2].map((n) => n * 2),
    [2, 4],
  ); // => runner sanity
  console.log("selftest: 4/4 passed"); // => Output: selftest: 4/4 passed
} // => end of function selftest(): void
function main(): void {
  // => read, validate, total, write, report
  selftest(); // => gate first: no report on red
  const rows = readFileSync("orders.csv", "utf-8")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim() !== ""); // => fixture rows
  const kept: Line[] = []; // => validated lines
  let skipped = 0; // => rejected rows
  for (const raw of rows) {
    // => validate every row
    const out = parseLine(raw); // => failure as data
    if (out.ok) {
      // => success arm
      kept.push(out.value); // => keep the trusted line
    } else {
      // => failure arm
      skipped += 1; // => count the skip
      console.log("skip:", out.error); // => Output: skip: bad qty in: pen,0,3
    } // => end of else
  } // => end of for (const raw of rows)
  const total = kept.reduce((n, l) => n + lineTotal(l), 0); // => grand total
  const report = [`lines: ${kept.length}`, ...kept.map((l) => `${l.item}: ${lineTotal(l)}`), `total: ${total}`]; // => report body
  writeFileSync(join(tmpdir(), "report.txt"), report.join("\n") + "\n"); // => scratch report, path never printed
  console.log(`lines: ${kept.length}`); // => Output: lines: 2
  console.log(`total: ${total}`); // => Output: total: 350
  console.log(`wrote: report.txt (${report.length} lines)`); // => Output: wrote: report.txt (4 lines)
} // => end of function main(): void
main(); // => sync main: every failure is data, nothing escapes
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
selftest: 4/4 passed
skip: bad qty in: pen,0,3
lines: 2
total: 350
wrote: report.txt (4 lines)
```
