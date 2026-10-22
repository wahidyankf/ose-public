---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its detail block: say the answer aloud in one or two sentences, then check. The questions follow the course order — control flow and errors first, libraries and tooling next, reading code last — so a missed question points at the level worth reworking.

### Q1 (co-01): When is an implicit truthiness test correct, and when must the comparison be explicit?

<details><summary>Answer</summary>

Implicit tests are correct for presence versus absence: empty strings, empty collections, and missing values. Explicit comparisons take over where falsy values are legitimate data — a count of zero, a port of zero — because truthiness would discard them. The rule is intent: presence asks implicitly, valid zeroes compare explicitly.

</details>

### Q2 (co-01): What do `?.` and `??` each contribute, and when do guard pyramids still win?

<details><summary>Answer</summary>

Optional chaining short-circuits to `undefined` at the first missing link; nullish coalescing converts the resulting absence into one fallback. Together they flatten uniform absence into one expression. Guard pyramids still win when each level needs a different fallback, because different absences deserve different defaults.

</details>

### Q3 (co-02): Why does the catch binding hold `unknown`, and how do you report it?

<details><summary>Answer</summary>

Anything can be thrown — Errors, strings, objects — so the honest type is `unknown`. Narrow with `instanceof Error` for real errors and `String(err)` for the rest, printing messages only, because stacks carry machine paths that poison deterministic transcripts.

</details>

### Q4 (co-02): When is a `Result` union preferable to an exception, and what does totality buy?

<details><summary>Answer</summary>

Results fit routine, expected failures — bad rows, zero divisors, missing keys — that callers must handle as part of normal work. Total functions never throw, so batch code collects every failure instead of dying on the first, and the `ok` discriminant makes ignoring failure a compile-time conversation.

</details>

### Q5 (co-03): Why is a filter-map chain preferable to an accumulator loop, and when do you loop?

<details><summary>Answer</summary>

The chain states input, condition, and mapping left to right as one sentence about data, while the loop scatters them across initialization, condition, and push. Loop again when the body needs side effects, early exit with complex conditions, or step debugging — pipelines trade breakpoints for brevity.

</details>

### Q6 (co-03): When should you reach for `Map` and `Set`, and when do plain objects suffice?

<details><summary>Answer</summary>

Reach for `Map` when keys are unknown at authoring time or non-strings, and for `Set` whenever the question is membership rather than mapping — constant-time answers with no prototype collisions. Plain objects suffice for fixed JSON shapes with known string keys.

</details>

### Q7 (co-04): What is the standard text-normalization prefix, and why that order?

<details><summary>Answer</summary>

Trim, unify case, fix known separators, then split, then trim each piece. Normalizing before splitting keeps the mess out of the pieces; trimming pieces after the split finishes the job. Splitting first bakes padding and case differences into the parts.

</details>

### Q8 (co-04): Why must query strings be built and parsed with `URL` classes, never concatenated?

<details><summary>Answer</summary>

Concatenation breaks on spaces, ampersands, and repeated parameters — values become structure and signatures stop matching. `set` encodes exactly once, `getAll` preserves repeats, and the round trip is exact, which makes malformed output unrepresentable instead of reviewable.

</details>

### Q9 (co-05): How do you make date output byte-stable across machines?

<details><summary>Answer</summary>

Construct fixed instants with `Date.UTC`, format with explicit time zones and fixed locales, and do day arithmetic in milliseconds. Local-zone formatting makes expectations a property of the machine, and hour arithmetic breaks on daylight-saving boundaries.

</details>

### Q10 (co-06): What contract does a barrel `index.ts` enforce, and what is its cost at scale?

<details><summary>Answer</summary>

The barrel offers one import door per folder and curates the public surface — only re-exported names are public — so interiors reorganize by editing one file. At unbundled scale one door can pull every re-export, so keep barrels per cohesive folder rather than one per project.

</details>

### Q11 (co-06): What does the `exports` map close, and why does that matter for versions?

<details><summary>Answer</summary>

It closes every unlisted subpath, so deep imports into internals fail instead of coupling to them. Internals then change without a major version, because only mapped doors are public API — no map means every file is public forever.

</details>

### Q12 (co-07): Where do ranges belong, where do pins belong, and what installs reproducibly?

<details><summary>Answer</summary>

Ranges belong in `package.json` as compatibility intent; exact pins belong in the lockfile, which the installer writes and humans never hand-edit. Installing with `npm ci` from the committed lockfile reproduces the tested tree instead of re-resolving it.

</details>

### Q13 (co-08): What are the three roles in the standard test tooling, and what does each own?

<details><summary>Answer</summary>

`node:test` owns structure — `describe`, `it`, subtests, hooks, mocks. `node:assert/strict` owns checks — strict equality, deep structure, throws, rejects. The runner owns execution, and the harness wrapper discards its timing-bearing report while echoing one fixed `PASS` line for byte-stable transcripts.

</details>

### Q14 (co-08): What does RED prove that GREEN alone cannot, and what must stay fixed between them?

<details><summary>Answer</summary>

RED proves the test is capable of failing, which is what makes GREEN worth believing — a suite that was never red cannot distinguish proving tests from vacuous ones. The wish stays fixed while only the implementation moves, so green means the code met the stated expectation.

</details>

### Q15 (co-09): How do you choose between sequential awaits, `Promise.all`, and `allSettled`?

<details><summary>Answer</summary>

Sequence with awaits when steps depend on each other's values. Fan out with `all` when steps are independent and any failure voids the batch — results arrive in input order. Harvest with `allSettled` when partial success still ships, splitting outcomes by status afterward.

</details>

### Q16 (co-09): What runs before a zero-millisecond timer, and why does that order hold?

<details><summary>Answer</summary>

Every queued microtask — explicit microtasks, promise callbacks, `await` continuations — drains first-in-first-out before the next macrotask. Timers wait in the macrotask queue, so they always observe the fully drained microtask queue, deterministically.

</details>

### Q17 (co-10): What does a generic constraint move from runtime to authoring time?

<details><summary>Answer</summary>

The misuse error: `K extends keyof T` fails compilation on a typo key instead of returning `undefined` three layers down, and structural bounds like `{ length: number }` admit shapes the compiler verifies instead of duck types it trusts. Constraints state assumptions in signatures.

</details>

### Q18 (co-10): Why derive type variants instead of hand-writing them, and with what tools?

<details><summary>Answer</summary>

Hand-written twins drift — one gains a field, the other does not — and the missed twin becomes a hole the types swore was sealed. Derive with `Partial` for updates, `Pick` for views, `Record` for dictionaries, and `(typeof X)[number]` for literal unions, so one source change reshapes every variant.

</details>

### Q19 (co-11): What are the three levels of mutation-proofing, and what does each cost?

<details><summary>Answer</summary>

`readonly` types reject reassignment at compile time, `Object.freeze` rejects it at runtime for untyped consumers, and copy-on-write transforms return new values instead of editing inputs. The cost is allocations and one-level-only spreads — copy each touched level, or clone deeply for unknown depth.

</details>

### Q20 (co-12): What two habits replace `any`, and what does `strict` add to each?

<details><summary>Answer</summary>

Take `unknown` at boundaries and narrow with `typeof` and `in` before use; compile under `strict` plus `noUncheckedIndexedAccess` so absences surface as types instead of crashes. Strictness converts runtime `undefined` crashes into authoring-time errors, and narrowing disposes of each in one expression.

</details>

### Q21 (co-13): How do typed and untyped code meet without a rewrite, in both directions?

<details><summary>Answer</summary>

TypeScript consumes JavaScript through `.d.ts` doors — declared types over untouched files, migrating file by file. JavaScript consumes TypeScript through `--declaration` emit — generated declarations publish the typed contract with no extra maintenance. Both directions keep one side running while the other gains types.

</details>

### Q22 (co-14): State the four naming rules and the failure each one prevents

<details><summary>Answer</summary>

Verbs for functions (a noun hides effects), nouns for types and values (a verb promises action), shout for module constants (lowercase invites reassignment), `is` prefixes for booleans (bare adjectives force double-takes). Consistent names convert reading from decoding into recognition.

</details>

### Q23 (co-15): Name three complexity-level performance idioms and what each proves

<details><summary>Answer</summary>

`join` over `+=` proves identical text with linear assembly; `Set.has` over `includes` proves identical verdicts with constant-time membership; single-pass `reduce` over filter-plus-map proves identical joins with no interim array. Each transcript asserts equality so the optimization never risks behavior drift.

</details>

### Q24 (co-16): What is the outside-in reading method, and what does each layer answer?

<details><summary>Answer</summary>

Name the shared types first (what shapes exist), the data second (what values flow), and the flow third (what transforms run) — then trace the fixed input through. Types answer vocabulary, data answers policy, flow answers mechanics, and the fixture makes every stage checkable instead of imagined.

</details>

## Applied problems

Work each on paper before checking the sketch: state the offending habit in one sentence, name the example that fixes it, then write the fix. The sketches name the target shape, not the full code — the code is the examples they point at.

1. **Rewrite the translation.** A new hire ports a phone-book lookup from Java: classes with getters, `for (let i = 0; ...)` loops, `null` returns for missing entries, string-path concatenation for a data file. Rewrite it idiomatically: `Map` lookups with `??` defaults (Example 6), `for-of` traversal (Example 3), `node:path` assembly (Example 21). Sketch: no index arithmetic, no nullable returns, no concatenated separators.
2. **Choose the error shape: batch import.** A nightly job imports five hundred vendor rows; three are malformed. Exceptions abort at row one and the operator fixes one row per night. Choose `allSettled`-style collection with a `Result` per row (Examples 10, 15, 57) so the run reports all three failures with their row numbers and imports the rest. Sketch: total row parser, split outcomes, one summary error.
3. **Choose the error shape: required config.** A service boots with a missing database host and crashes ten layers deep on `undefined.host`. Choose fail-fast at the boundary: assertion functions (Example 12) or `fail` with `??` (Example 16) in the config loader, so the boot report names the missing field. Sketch: `assertDefined` per required field before any consumer runs.
4. **Choose the error shape: flaky fetch.** A dashboard fetch fails one morning in twenty; today the code retries in a `while (true)` with no budget and hung the worker pool. Choose bounded retry with `race` timeouts plus `AbortController` (Examples 58, 59, 72): fixed tries, named give-up, losers cancelled. Sketch: `withRetry` with attempts out, timeout race per attempt.
5. **Replace the hand-rolled helper.** A utility file holds `parseQuery` (splits on `&`), `joinPath` (concatenates with `/`), and `deepCopy` (spreads one level). Replace all three with the standard library: `URLSearchParams` (Example 20), `node:path` (Example 21), `structuredClone` (Example 51). Sketch: delete the file, import the stdlib, keep the call sites' behavior identical per golden transcripts.
6. **Generic-ify the triplets.** Three getters — string, number, boolean — differ only by type, and a fourth type is coming. Unify them into one `getField` with `K extends keyof T` (Example 46), then delete the triplets. Sketch: callers keep their types, the typo key that used to return `undefined` now fails compilation.
7. **Audit the dependency lists.** A latency-sensitive service ships its test runner to production and resolves a caret range fresh on every deploy. Split the lists (`dependencies` vs `devDependencies`, Example 33), commit the lockfile (Example 31), install with `npm ci`, and gate the runtime floor with `engines` (Example 34). Sketch: smaller image, reproducible installs, one clear message on old runtimes.
8. **Flatten the pyramid.** A profile reader nests four `if`s deep to reach an email preference, and the happy path sits at column sixteen. Flatten it with `?.` plus `??` (Examples 2, 17) or guard clauses (Example 14) so the fallback is stated once. Sketch: one expression, one fallback, the four-level tree gone.

## Code katas

Each kata ships a `before/` starter holding the smell and an `after/` solution holding the fix; only the `after/` side runs green in the harness. Work the loop: name the smell, write your fix without peeking, run it, then diff against the committed solution. The run command for katas mirrors the examples: compile strict, run with node, compare against `expected/main.stdout.txt` (kata 2 runs `node --test` through the same `PASS`-echo wrapper as the testing cluster).

### Kata 1: exception style to Result style (`kata-01-error-style-conversion`)

The starter throws on unknown catalog items, forcing every caller to wrap. Convert the lookup to a `Result`-returning total function and drive a mixed cart that totals the known and collects the unknown.

**`drilling/code/kata-01-error-style-conversion/before/starter.ts`**:

```typescript
// => Kata 1 starter: throws on absence; callers must wrap every call.
export function priceOf(item: string): number {
  // => throws for unknown items
  const prices: Record<string, number> = { lamp: 25, desk: 150 }; // => known catalog
  const price = prices[item]; // => lookup may miss
  if (price === undefined) {
    // => absence throws
    throw new Error(`unknown item: ${item}`); // => exception-style failure
  } // => end of if (price === undefined)
  return price; // => known item escapes
} // => end of export function priceOf(item: string): number
```

**`drilling/code/kata-01-error-style-conversion/after/solution.ts`**:

```typescript
// => Kata 1 solution: failure as data; the total function never throws.
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => outcome union
function priceOf(item: string): Result<number> {
  // => total function
  const prices: Record<string, number> = { lamp: 25, desk: 150 }; // => known catalog
  const price = prices[item]; // => lookup may miss
  if (price === undefined) {
    // => absence as data
    return { ok: false, error: `unknown item: ${item}` }; // => failure value
  } // => end of if (price === undefined)
  return { ok: true, value: price }; // => success value
} // => end of function priceOf(item: string): Result<number>
const cart = ["lamp", "pen", "desk"]; // => one unknown item inside
let total = 0; // => running total
const missing: string[] = []; // => collected failures
for (const item of cart) {
  // => every item handled, none thrown
  const out = priceOf(item); // => no try needed
  if (out.ok) {
    // => success arm
    total += out.value; // => accumulate
  } else {
    // => failure arm
    missing.push(out.error); // => collect
  } // => end of else
} // => end of for (const item of cart)
console.log("total:", total); // => Output: total: 175
console.log("missing:", missing.join("; ")); // => Output: missing: unknown item: pen
```

**Output** (`drilling/code/kata-01-error-style-conversion/expected/main.stdout.txt`):

```text
total: 175
missing: unknown item: pen
```

### Kata 2: write the test first (`kata-02-node-test-first`)

The starter totals order lines but ignores quantities — a bug no test catches because no test exists. Write the two cases first (the wish), watch them fail against the starter, then fix the helper until green.

**`drilling/code/kata-02-node-test-first/before/starter.ts`**:

```typescript
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
```

**`drilling/code/kata-02-node-test-first/after/solution.ts`**:

```typescript
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
```

**`drilling/code/kata-02-node-test-first/after/solution.test.ts`**:

```typescript
/// <reference path="./node.d.ts" />
// => Kata 2 solution file 2: the wish written as tests; the fix makes them green.
import { describe, it } from "node:test"; // => the standard runner pair
import { strictEqual } from "node:assert/strict"; // => scalar assertions
import { total } from "./solution.js"; // => helper under test
describe("total", () => {
  // => one group for the helper
  it("sums price times qty", () => {
    // => the wish that caught the bug
    strictEqual(
      total([
        { price: 25, qty: 2 },
        { price: 3, qty: 1 },
      ]),
      53,
    ); // => 50 + 3
  }); // => end of it("sums price times qty", () =>
  it("totals nothing for no lines", () => {
    // => the empty edge
    strictEqual(total([]), 0); // => zero lines, zero total
  }); // => end of it("totals nothing for no lines", () =>
}); // => end of describe("total", () =>
```

**Output** (`drilling/code/kata-02-node-test-first/expected/main.stdout.txt`):

```text
PASS: kata-02-node-test-first (2 checks)
```

### Kata 3: hand-rolled query parsing to URLSearchParams (`kata-03-stdlib-text`)

The starter splits queries on every ampersand, which corrupts values holding encoded separators. Replace it with `URLSearchParams` and prove repeats plus an encoded ampersand survive.

**`drilling/code/kata-03-stdlib-text/before/starter.ts`**:

```typescript
// => Kata 3 starter: hand-rolled query parsing that breaks on encoded values.
export function getTag(query: string): string {
  // => BUG: splits on every ampersand
  const pairs = query.split("&"); // => breaks when a value holds an encoded &
  for (const pair of pairs) {
    // => scan pairs
    const [k, v] = pair.split("="); // => split key from value
    if (k === "tag") {
      // => wanted key
      return decodeURIComponent(v ?? ""); // => decode comes too late for split damage
    } // => end of if (k === "tag")
  } // => end of for (const pair of pairs)
  return ""; // => missing tag
} // => end of export function getTag(query: string): string
```

**`drilling/code/kata-03-stdlib-text/after/solution.ts`**:

```typescript
// => Kata 3 solution: URLSearchParams parses once, correctly, including repeats.
function getTags(query: string): string[] {
  // => all tag values in order
  const params = new URLSearchParams(query); // => WHY stdlib: encoding handled once
  return params.getAll("tag"); // => repeats kept
} // => end of function getTags(query: string): string[]
const tags = getTags("tag=ts&tag=node+%26+npm&page=2"); // => encoded ampersand inside
console.log(tags.join(",")); // => Output: ts,node & npm
console.log(tags.length); // => Output: 2
```

**Output** (`drilling/code/kata-03-stdlib-text/expected/main.stdout.txt`):

```text
ts,node & npm
2
```

### Kata 4: any to unknown with narrowing (`kata-04-unknown-narrowing`)

The starter takes `any` and dereferences blindly, so wrong shapes explode at runtime. Harden the signature to `unknown`, gate the shape, narrow the field, and reject the rest by name.

**`drilling/code/kata-04-unknown-narrowing/before/starter.ts`**:

```typescript
// => Kata 4 starter: any silences the compiler; wrong shapes explode at runtime.
export function areaOf(raw: any): number {
  // => BUG: any trusts every caller
  return Math.PI * raw.r * raw.r; // => explodes when r is missing
} // => end of export function areaOf(raw: any): number
```

**`drilling/code/kata-04-unknown-narrowing/after/solution.ts`**:

```typescript
// => Kata 4 solution: unknown forces the shape gate; misuse is rejected, not crashed.
function areaOf(raw: unknown): number {
  // => honest signature
  if (typeof raw === "object" && raw !== null && "r" in raw) {
    // => shape gate
    const { r } = raw as { r: unknown }; // => pull the field loosely
    if (typeof r === "number") {
      // => narrow the field
      return Math.PI * r * r; // => safe arithmetic
    } // => end of if (typeof r === "number")
  } // => end of if (typeof raw === "object" && raw !== null && "r" i
  throw new Error("need { r: number }"); // => rejection names the shape
} // => end of function areaOf(raw: unknown): number
console.log(areaOf({ r: 1 }).toFixed(2)); // => Output: 3.14
try {
  // => the unshaped payload below
  areaOf({ r: "big" }); // => string radius must fail
} catch (err) {
  // => report the boundary rejection
  console.log("rejected:", err instanceof Error ? err.message : err); // => Output: rejected: need { r: number }
} // => end of catch (err)
```

**Output** (`drilling/code/kata-04-unknown-narrowing/expected/main.stdout.txt`):

```text
3.14
rejected: need { r: number }
```

### Kata 5: shared mutation to frozen update (`kata-05-frozen-update`)

The starter mutates a shared default config, so callers see each other's edits. Lock the shape with `readonly` and return spread-updated copies that leave the default untouched.

**`drilling/code/kata-05-frozen-update/before/starter.ts`**:

```typescript
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
```

**`drilling/code/kata-05-frozen-update/after/solution.ts`**:

```typescript
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
```

**Output** (`drilling/code/kata-05-frozen-update/expected/main.stdout.txt`):

```text
9 3
localhost
```

### Kata 6: triplet getters to one generic (`kata-06-generic-getter`)

The starter holds three getters differing only by value type, and a fourth type is already requested. Unify them into one constrained generic getter and prove it serves a mixed record.

**`drilling/code/kata-06-generic-getter/before/starter.ts`**:

```typescript
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
```

**`drilling/code/kata-06-generic-getter/after/solution.ts`**:

```typescript
// => Kata 6 solution: one generic getter serves every value type.
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  // => WHY generic: key must exist on T
  return obj[key]; // => the lookup cannot miss
} // => end of function getField<T, K extends keyof T>(obj: T, key:
const row = { slug: "kata", hours: 2, done: true }; // => mixed record
console.log(getField(row, "slug"), getField(row, "hours"), getField(row, "done")); // => Output: kata 2 true
```

**Output** (`drilling/code/kata-06-generic-getter/expected/main.stdout.txt`):

```text
kata 2 true
```

### Kata 7: sequential awaits to Promise.all (`kata-07-promise-all`)

The starter awaits independent loads one per loop iteration, serializing work that could run together. Fan the loads out with `Promise.all` and prove identical ordered results.

**`drilling/code/kata-07-promise-all/before/starter.ts`**:

```typescript
// => Kata 7 starter: sequential awaits serialize independent work.
export async function loadAll(ids: string[]): Promise<string[]> {
  // => BUG: waits per id in turn
  const out: string[] = []; // => collected rows
  for (const id of ids) {
    // => each iteration waits for the last
    out.push(await Promise.resolve(`row:${id}`)); // => independent work, serialized
  } // => end of for (const id of ids)
  return out; // => correct values, wasted time
} // => end of export async function loadAll(ids: string[]): Promis
```

**`drilling/code/kata-07-promise-all/after/solution.ts`**:

```typescript
// => Kata 7 solution: Promise.all starts every fetch before awaiting any.
function loadAll(ids: string[]): Promise<string[]> {
  // => concurrent fan-out
  return Promise.all(ids.map((id) => Promise.resolve(`row:${id}`))); // => WHY all: together, ordered
} // => end of function loadAll(ids: string[]): Promise<string[]>
async function main(): Promise<void> {
  // => WHY wrapper: no top-level await in commonjs
  console.log((await loadAll(["a", "b", "c"])).join(" ")); // => Output: row:a row:b row:c
} // => end of async function main(): Promise<void>
void main(); // => floating promise: rejections would fail the run loudly
```

**Output** (`drilling/code/kata-07-promise-all/expected/main.stdout.txt`):

```text
row:a row:b row:c
```

### Kata 8: guard pyramid to flat chain (`kata-08-flat-guards`)

The starter nests two guards deep to reach an optional email, burying the happy path. Flatten it to one `?.` plus `??` expression and prove all three absence depths plus the present case.

**`drilling/code/kata-08-flat-guards/before/starter.ts`**:

```typescript
// => Kata 8 starter: nested guards push the happy path two levels deep.
export interface Profile {
  // => optional shape
  contact?: {
    // => optional nest
    email?: string; // => optional leaf
  }; // => end of contact?:
} // => end of export interface Profile
export function emailOf(p: Profile): string {
  // => BUG: pyramid of guards
  if (p.contact !== undefined) {
    // => level one
    if (p.contact.email !== undefined) {
      // => level two
      return p.contact.email; // => happy path buried
    } else {
      // => leaf missing
      return "no-email"; // => fallback one
    } // => end of else
  } else {
    // => nest missing
    return "no-email"; // => fallback two, same value
  } // => end of else
} // => end of export function emailOf(p: Profile): string
```

**`drilling/code/kata-08-flat-guards/after/solution.ts`**:

```typescript
// => Kata 8 solution: ?. plus ?? flatten the pyramid into one expression.
interface Profile {
  // => same optional shape
  contact?: {
    // => optional nest
    email?: string; // => optional leaf
  }; // => end of contact?:
} // => end of interface Profile
function emailOf(p: Profile): string {
  // => one expression
  return p.contact?.email ?? "no-email"; // => WHY ?. plus ??: missing at any depth falls back
} // => end of function emailOf(p: Profile): string
console.log(emailOf({})); // => Output: no-email
console.log(emailOf({ contact: {} })); // => Output: no-email
console.log(emailOf({ contact: { email: "a@example.com" } })); // => Output: a@example.com
```

**Output** (`drilling/code/kata-08-flat-guards/expected/main.stdout.txt`):

```text
no-email
no-email
a@example.com
```

## Self-check checklist

Mark each honestly: you pass an item only when you can do it closed-book on a fresh problem, not when you recognize it here. Rework the mapped examples for every miss.

1. I can rewrite a nullable-check chain into truthiness tests with `||` and `??` defaults without losing valid zeroes (co-01).
2. I can flatten a two-deep optional access into one `?.` plus `??` expression (co-01).
3. I can keep a `try` block narrow around the risky call and narrow its `unknown` catch with `instanceof` (co-02).
4. I can model a routine failure as a `Result` union and handle both arms at the boundary (co-02).
5. I can convert an accumulator loop into a filter-map chain and name when to loop instead (co-03).
6. I can choose `Map` and `Set` over plain objects and pair lookups with `??` defaults (co-03).
7. I can normalize pasted text with trim-case-replace-split and parse repeated structure with named-group `matchAll` (co-04).
8. I can build and read query strings with `URL` and `URLSearchParams` without concatenating (co-04).
9. I can format a fixed instant in named zones with fixed locales and add days in exact milliseconds (co-05).
10. I can organize shared helpers behind named exports, a barrel door, and an `exports` map (co-06).
11. I can pin compiler policy in `tsconfig.json` and build every project the same way with `tsc -p` (co-06).
12. I can split runtime and tool dependencies, commit the lockfile, and gate the runtime floor (co-07).
13. I can structure a suite with `describe` and `it` and assert with `node:assert/strict` (co-08).
14. I can write the failing test first, watch it fail, and keep the wish fixed until green (co-08).
15. I can fan independent work out with `Promise.all`, harvest partial batches with `allSettled`, and budget slow work with `race` (co-09).
16. I can predict microtask versus macrotask order for awaits, promises, and timers (co-09).
17. I can write a generic helper with `extends` and `keyof` bounds that callers use without annotations (co-10).
18. I can derive type variants with `Partial`, `Pick`, `Record`, and `as const` unions instead of duplicating shapes (co-10).
19. I can lock records with `readonly` and `Object.freeze` and update them by returning new values (co-11).
20. I can compile under `strict` with `noUncheckedIndexedAccess` and replace every `any` with narrowed `unknown` (co-12).
21. I can type foreign JavaScript with `.d.ts` doors and emit declarations for JavaScript consumers (co-13).
22. I can name functions with verbs, values with nouns, constants in shout, and booleans with `is` (co-14).
23. I can replace `+=` assembly with `join`, scans with `Set` lookup, and staged chains with one `reduce` pass (co-15).
24. I can read an unfamiliar idiomatic module outside in — types, data, flow — and explain it in one pass (co-16).

## Elaborative interrogation & self-explanation

For each prompt, argue both sides aloud before reading the model answer: name the design choice, name the rejected alternative, and say when the alternative would win. An answer you cannot defend against its alternative is memorized, not learned.

1. **Why do routine failures travel as `Result` values here instead of exceptions — and when would you throw instead?** The course models expected failures (bad rows, zero divisors) as unions so batch code collects every failure and the compiler enforces handling. Throw instead for programmer errors and violated invariants — missing required config, impossible branches — where continuing would corrupt downstream data. The rejected alternative (exceptions everywhere) hides branches in signatures; it wins only where failure truly cannot continue, which is exactly the throwing case.
2. **Why does the batch pattern choose `allSettled` over `all` for harvests — and when would `all` win?** Settled outcomes keep partial success shippable and report every failure, matching how operators handle imports and notifications. `all` wins when the batch is atomic — one failure voids everything — because failing fast beats collecting successes that must be rolled back. The rejected alternative (always `all`) discards good work; it wins when good work without the missing piece is worthless.
3. **Why does the course copy with spread at known depth and `structuredClone` at unknown depth — and when would you mutate in place?** Spread copies exactly the levels you name, which documents the independence boundary; `structuredClone` copies whole graphs including Dates and Maps for snapshots. Mutate in place when the value is locally owned and short-lived — loop accumulators, builders consumed once — where copying buys nothing and allocation pressure is real. The rejected alternative (always clone) wastes memory on unique hot paths; it wins for shared, long-lived state.
4. **Why do testing examples split between the real `node:test` runner and inline assertion mains — and when would you pick each?** The runner proves standard-tooling fluency with structure, mocks, and timers; inline mains print fixed transcripts when the teaching point is the assertion table rather than the runner. Runner shape wins for suites with fixtures and mocks; inline wins for single-idea demonstrations where reporter output would obscure the lesson. The rejected alternative (one shape everywhere) either hides the standard tool or litters transcripts with timings.
5. **Why do modules expose barrels and `exports` maps instead of deep import paths — and when would you import deep?** Barrels and maps decouple the public surface from interior layout, so refactors touch one file and compatibility holds across minors. Deep imports win inside the package itself, where the layout is the team's own business and indirection adds noise. The rejected alternative (deep everywhere) freezes file layout; it wins only within a folder that owns both ends.
6. **Why does memoization need explicit switching rules instead of being the default — and when is recompute right?** Memo trades memory for repeated work with identical inputs; unique inputs leak the cache forever, cheap functions pay lookup overhead for no win, and stale entries serve yesterday's answers. Recompute wins when inputs rarely repeat, results cost less than lookups, or freshness matters. The rejected alternative (memo everything) is a leak with a performance excuse; it wins only under measured repetition, which the counter in Example 78 makes visible.
