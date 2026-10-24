---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns the sixteen concepts into reflexes: recall questions that test memory, applied problems that test judgment, katas that test hands, checklists that test coverage, and interrogation that tests understanding of why each idiom won. Work them in order: recall first so the vocabulary is present, applied problems next so judgment forms, katas after so the hands learn what the head already knows, then the checklist and interrogation to close the gaps the first three exposed.

## Recall Q&A

Twenty-four questions, at least one for each of co-01 to co-16. Answer aloud before opening the detail block; a hesitation is a gap, not a failure.

### Q1: What makes `if` an expression in F#, and what must its branches share?

<details>
<summary>Answer</summary>

`if`, `elif`, and `else` form one expression that answers a value, so the whole chain can sit on the right side of a binding. Every branch must answer the same type — the chain's type is the shared branch type. A branch returning a different type fails the build, which catches mixed-outcome mistakes before any run. (Concepts: co-01.)

</details>

### Q2: How does `match` order decide, and where does the wildcard belong?

<details>
<summary>Answer</summary>

Clauses run top to bottom and the first fitting shape wins, so specific shapes come first and the wildcard closes the table. A `when` guard refines a shape with a boolean the pattern alone cannot ask. On closed unions every case gets an explicit arm and the wildcard stays away; on open inputs the wildcard is the documented fallback, never a silent hole. (Concepts: co-01.)

</details>

### Q3: When do failures travel as `Option`, when as `Result`, and when as exceptions?

<details>
<summary>Answer</summary>

Absence travels as `None` when the caller branches on missing values; handled faults travel as `Error` when the caller should match and continue; broken contracts raise when only the boundary can decide. `Option.bind` chains dependent lookups, `Result.bind` chains validations, and `try/with` at the edge converts raises into answers. The consumer of the failure chooses the shape. (Concepts: co-02.)

</details>

### Q4: Why does a retry loop carry its budget as an argument?

<details>
<summary>Answer</summary>

A countdown in the signature makes the bound reviewable and the exhaustion path testable: `retry 3` succeeds on the last attempt while `retry 1` gives up at once and answers `Error`. Retry without a bound is an outage with extra steps, because a permanently failing dependency turns the loop into an infinite hang. Budgets are arguments, not comments, so the transcript proves they bind. (Concepts: co-02.)

</details>

### Q5: How do you choose between list functions for one question?

<details>
<summary>Answer</summary>

Name the question first: membership is a `Set` question, first match is `tryFind`, full counting is `filter` plus length or `sumBy`, grouping is `groupBy`. `find` stops at the first witness while `filter` walks the whole list. Reaching for the exact function states the question in the code, so reviewers check the answer instead of simulating a loop. (Concepts: co-03.)

</details>

### Q6: Lists, arrays, or sequences — which container for which job?

<details>
<summary>Answer</summary>

Lists for prepending and recursion, arrays for indexing and in-place update, sequences for lazy or endless data. `head` and pattern matching fall out of list construction, indexing is the array question, and `take` bounds even infinite sequences. Convert freely at boundaries with `Array.ofList`, `Seq.toList`, and friends — the choice stays local to the function needing the access pattern. (Concepts: co-03.)

</details>

### Q7: What stays lazy in a sequence pipeline, and what forces it?

<details>
<summary>Answer</summary>

`map`, `filter`, and `collect` describe stages without computing; `take`, `toList`, `length`, and `iter` pull and materialize. An infinite source with a finite `take` computes exactly the demanded prefix. Forcing runs the whole pipeline per element pulled, so side effects inside lazy stages repeat on re-iteration — keep stages pure and the laziness stays honest. (Concepts: co-03.)

</details>

### Q8: How does `fold` replace a loop, and what does its signature carry?

<details>
<summary>Answer</summary>

`List.fold` threads an accumulator: the folder takes the accumulator first and the element second, the seed starts the answer, and the final accumulator is the result. Sum, count, join, and group-by are folds with different seeds. The seed's type is the answer's type, which is why one function covers so many jobs — pick the seed, write the step, and the loop disappears. (Concepts: co-03.)

</details>

### Q9: Which string functions cover most text work, and which culture?

<details>
<summary>Answer</summary>

`Split`, `Trim`, `Replace`, `ToUpperInvariant`, and `String.Join` cover most lines before any dependency earns its place. The invariant culture keeps behavior identical across machines; the current culture follows the machine's locale and forks transcripts. Text pipelines that must agree everywhere — tests, transcripts, fixtures — stay on the invariant forms. (Concepts: co-04.)

</details>

### Q10: How do you read a file deterministically in a script?

<details>
<summary>Answer</summary>

Resolve the fixture through `__SOURCE_DIRECTORY__`, never the launch directory; read with `ReadAllLines`, trim each line, drop blanks, and sort before printing. Anchor every path with `Path.Combine` instead of string concatenation. Scratch writes go to one fixed `/tmp` path with fixed bytes and are deleted before exit, so reruns start from the same state. (Concepts: co-04.)

</details>

### Q11: Why are dates constructed rather than read, and how are they formatted?

<details>
<summary>Answer</summary>

Constructed dates make time examples deterministic — the same script prints the same text on every machine. Format with an explicit pattern plus `InvariantCulture` so month and day names never follow the machine locale, and keep `DateTimeKind.Unspecified` to avoid silent local-time conversions. `TryParseExact` keeps parsing total: the boolean gates every read of the parsed value. (Concepts: co-05.)

</details>

### Q12: What does `TryParseExact` guarantee that a throwing parse does not?

<details>
<summary>Answer</summary>

`TryParseExact` attempts one exact pattern and answers a boolean, so the value is read only on success and the failure names the offending text as an `Error`. Throwing parsers unwind for input that was always allowed to be wrong. The exact pattern is the contract — `yyyy-MM-dd` accepts October 21st and rejects 21/10/2026 — enforced at the boundary where the fix is cheap. (Concepts: co-05, co-02.)

</details>

### Q13: When does a module earn its existence, and what stays private?

<details>
<summary>Answer</summary>

A module earns its existence at the second consumer of its logic — one job, one name, one public door per function group. Helpers stay private until a sibling module needs them, then go internal; public is reserved for the surface the project promises to keep. Promote one level per real consumer, never in advance, because layout changes packaging without changing behavior. (Concepts: co-06.)

</details>

### Q14: What does the lock file pin, and what does an empty one declare?

<details>
<summary>Answer</summary>

The lock file pins every dependency's exact version and hash, so restores reproduce the same graph on every machine. A lock with zero resolved entries declares stdlib-only on purpose — the strongest dependency statement a project can make. The lock is committed, versions come from the lock rather than floating ranges, and tampering fails the restore closed. (Concepts: co-07.)

</details>

### Q15: What are the three declarations every project file carries?

<details>
<summary>Answer</summary>

The SDK import names the toolchain, the target framework names the runtime, and the compile list names the sources in compilation order. F# compiles in order, so the file list is also a dependency story — later files may use earlier ones, never the reverse. Reading those three facts orients a newcomer before any source is opened. (Concepts: co-06, co-07.)

</details>

### Q16: What does the standard check helper do, and what does the gate read?

<details>
<summary>Answer</summary>

`check` compares expected with actual, records the verdict, prints one fixed line per case, and never raises mid-suite — one red case must never hide the rest. The suite summary is a value: counts of run and failed that the gate reads before any report prints. Green proceeds, red raises, and the transcript proves which happened with counts rather than claims. (Concepts: co-08.)

</details>

### Q17: How do table-driven cases and property tables differ, and how do you prove a performance claim?

<details>
<summary>Answer</summary>

Tables list explicit input-and-expected rows — best for boundaries like the exact 90 or the empty string — while property tables generate dozens of cases by formula and assert one property over all of them. Tables prove the edges, properties prove the shape; the course uses both because boundaries carry the bugs and properties carry the confidence. Print the case count so breadth is proven, not implied. Performance claims print deterministic operation counts instead of timings: Example 52 counts copied characters per report build, and Example 66 copies snapshots by construction — the same counts on every machine, which timings can never promise. (Concepts: co-08, co-15.)

</details>

### Q18: Which concurrency primitive answers which need?

<details>
<summary>Answer</summary>

`Async.Parallel` joins independent batches in input order; `MailboxProcessor` serializes shared state through one inbox; `Event` broadcasts ordered in-process notifications; `task` awaits at .NET boundaries; cancellation tokens carry cooperative stops. Direct calls win by default — each primitive buys one guarantee at one price, so the need must precede the machinery. (Concepts: co-09.)

</details>

### Q19: Why are async workflows cold, and where does awaiting live?

<details>
<summary>Answer</summary>

Workflows describe plans without running them — defining one executes nothing until `RunSynchronously` or a join runs it. `let!` awaits inside the workflow in order; `Async.Parallel` joins independent stages with positions preserved. Sorting explicit outputs or relying on positional joins keeps transcripts deterministic regardless of scheduling. Convert between `async` and `task` once at the seam with `Async.AwaitTask`. (Concepts: co-09.)

</details>

### Q20: When is code generic, and what varies it without type tests?

<details>
<summary>Answer</summary>

Logic that never inspects the type goes generic over `'a` — swap, pair, wrap, count — with inference keeping call sites annotation-free. Domain rules stay concrete because the type names document them. When generic logic needs type-specific behavior it takes a function argument, and when one formula must serve several numeric types it goes `inline` with `DivideByInt`-style constraints that specialize per call site. Never branch on types. (Concepts: co-10.)

</details>

### Q21: What do units of measure check, and what do they cost?

<details>
<summary>Answer</summary>

Units tag floats with dimensions — kilometres, hours, and their compounds — and the compiler rejects mixed-dimension arithmetic like adding times to distances. They cost nothing at runtime because they erase after checking. Tag quantities at the boundary where bare numbers enter, and stripping back to numbers stays explicit with a division by one unit. (Concepts: co-10, co-11.)

</details>

### Q22: What does the formatter own, and what stays human?

<details>
<summary>Answer</summary>

Fantomas owns spacing, indentation, and line breaks — style trivia ends where its output begins. Humans own stage order in pipelines, contract wording in `///` docs, arm coverage in matches, and name choices everywhere. The layered posture is mechanical: format layout, document contracts, exhaust matches, style names — each layer moving one class of finding from reviewers to tools. (Concepts: co-12, co-14.)

</details>

### Q23: How do you call .NET libraries from F#, and where do collections convert?

<details>
<summary>Answer</summary>

Construct BCL types directly, call methods with dots, and convert collections once at the edge — `Seq.toList` coming in, `ToArray` or `ToList` going out. Generics translate directly, methods overload normally, and `open System.Linq` brings the second vocabulary where the surrounding code already speaks it. F# never wraps the runtime; it stands on it, and the seam stays one conversion thick. (Concepts: co-13.)

</details>

### Q24: What are the five reading passes, and which one is usually skipped?

<details>
<summary>Answer</summary>

Purpose, shapes, flow, failures, summary — one written line each, in order. Purpose names the job, shapes list the types, flow traces the happy path, failures map every exit, and the summary compresses all four into the tell-a-colleague line. Intuition skips failures and shapes most often, which is exactly why the checklist orders them before the summary. (Concepts: co-16.)

</details>

## Applied problems

Eight judgment problems. Each names the situation, the candidate approaches, and what a good answer shows. Work them on paper before checking the concept refs.

### AP1: Rewrite the translated accent

A teammate ports a C-style counting loop into F#: an index `for` over a list with `names.[i]` on every iteration and a mutable counter. Rewrite it so the collection question is visible, and state which example's rule you applied. A good answer names `filter` plus length without indexing, and cites the question-first rule. (Concepts: co-03, co-14.)

### AP2: Choose the failure shape for three faults

A file importer meets three faults: a missing file, a malformed row, and a negative quantity that violates the import contract. Assign `Option`, `Result`, or an exception to each, and say who acts on each assignment. A good answer misses the file as data the caller handles, fails the row as tagged context, and raises on the contract break — with the actor named per shape. (Concepts: co-02.)

### AP3: Pick the error-handling approach for three scenarios

A web handler parses a query integer, looks up a user that may not exist, and divides by a caller-supplied divisor. Choose `TryParse` plus `Result`, `tryFind` plus `Option`, and a guarded division for the three, and show where each converts into the response. A good answer keeps all three total to the response boundary with no `try/with` around expected faults. (Concepts: co-02.)

### AP4: Replace the hand-rolled helper with the library call

A codebase carries a fifteen-line `dedupAndSort` helper with a mutable seen-set and an insertion loop. Find the two library calls that replace it, prove equivalence on the fixture from Example 21, and pin the replacement with a three-case suite. A good answer answers `distinct` plus `sort`, shows the fixture transcript unchanged, and keeps the suite green. (Concepts: co-03, co-08.)

### AP5: Choose the collection for three access patterns

A log analyzer prepends entries during ingestion, indexes into a fixed window for display, and streams a ten-gigabyte archive it must never fully load. Assign list, array, and sequence to the three stages with the conversion points named. A good answer prepends into a list, copies the window to an array, and streams the archive as a sequence — with exactly two conversions. (Concepts: co-03.)

### AP6: Write the test that fails first

A discount rule changes: bulk now starts at ten instead of above ten. Write the regression case that would have caught the old boundary, run it mentally against both versions, and record the history note the example format requires. A good answer pins quantities nine, ten, and eleven with the note naming the off-by-one the old guard carried. (Concepts: co-08.)

### AP7: Choose the concurrency primitive for three workloads

An image pipeline resizes one hundred independent thumbnails, a single inventory counter takes orders from five feeds, and a progress bar needs every completion event in order. Assign parallel stages, an agent, and an event to the three, and state what breaks if the assignments rotate. A good answer parallels the thumbnails, agents the counter, and events the progress — with the rotation costs named per swap. (Concepts: co-09.)

### AP8: Read an unfamiliar sample in five passes

Take the capstone script and produce the five reading lines: its one-sentence purpose, its boundary shapes, its happy-path flow, its failure exits, and its tell-a-colleague summary. A good answer names grade-book summarizing, string-lists to ranked lines, parse-classify-rank-report, the missing-file exit plus suite gate, and the verified-report summary. (Concepts: co-16.)

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: error handling and tests first, because failures and proofs underlie everything; pipelines and modules next, because they train the two reflexes idiomatic code demands; unions and accents last, because each isolates one intermediate judgement.

### Kata 01: Convert a Raised String into a Result

(Concepts: co-02.)

The starter raises a bare message string with the shortfall baked in. Convert it so the failure carries its context as data, and read the shortfall back out field by field. Done looks like the happy-path print unchanged plus explicit shortfall, balance, and amount fields.

**Before** (`drilling/code/kata-01-exception-to-result/before/starter.fsx`):

```fsharp
// => Kata 1 starter: stringly failures force callers to parse messages.
let withdraw balance amount = // => two arguments in, remainder or raise out.
    // => Happy path subtracts; the failure path raises a bare message.
    if balance >= amount then balance - amount // => the guard decides value versus raise.
    else failwith (sprintf "need %d have %d" amount balance) // => stringly failure callers must parse.
// => The happy path works; the failing call would raise instead of answering.
printfn "left=%d" (withdraw 100 30) // => prints 70; the raise path stays unprinted.
```

**After** (`drilling/code/kata-01-exception-to-result/after/solution.fsx`):

```fsharp
// => Kata 1 solution: tagged shortfalls carry context as data, not prose.
type Shortfall = { Balance: int; Amount: int; Short: int } // => the failure facts as fields.
let withdraw balance amount = // => same shape as the starter, Result instead of raise.
    // => Compare first; both branches return the same tagged shape.
    if balance >= amount then Ok (balance - amount) // => happy path wraps the remainder.
    else Error { Balance = balance; Amount = amount; Short = amount - balance } // => facts, not prose.
// => The happy path prints through the same match the failure path uses.
let show o = match o with Ok left -> sprintf "left=%d" left | Error s -> sprintf "short=%d balance=%d amount=%d" s.Short s.Balance s.Amount // => one renderer.
printfn "%s" (show (withdraw 100 30)) // => left=70 through the match.
printfn "%s" (show (withdraw 10 30)) // => short=20 balance=10 amount=30.
```

**Output** (`drilling/code/kata-01-exception-to-result/expected/main.stdout.txt`):

```text
left=70
short=20 balance=10 amount=30
```

### Kata 02: Write the First Check Suite

(Concepts: co-08.)

The starter defines a discount function with no tests. Add a suite with two facts that pin its behavior, print the fixed summary, and gate on red. Done looks like the standard summary line with two tests and zero failures.

**Before** (`drilling/code/kata-02-first-check-suite/before/starter.fsx`):

```fsharp
// => Kata 2 starter: a discount function with no tests pinning it.
let discount total = if total > 100 then total * 9 / 10 else total // => the untested rule.
// => The function works; nothing proves it stays working.
printfn "large=%d small=%d" (discount 200) (discount 50) // => 180 and 50, unpinned.
```

**After** (`drilling/code/kata-02-first-check-suite/after/solution.fsx`):

```fsharp
// => Kata 2 solution: the first suite pins the discount with two facts.
let results = ResizeArray<string * bool>() // => the suite record: name plus verdict.
// => check compares, records, and prints one fixed line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => the suite remembers every case.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The function under test, unchanged from the starter.
let discount total = if total > 100 then total * 9 / 10 else total // => the pinned rule.
// => Two facts pin the rule from both sides of its boundary.
check "discounts large totals" 180 (discount 200) // => large totals take ten percent off.
check "leaves small totals alone" 50 (discount 50) // => small totals pass through.
// => Gate and counted summary close the kata.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 2 tests, 0 failures.
```

**Output** (`drilling/code/kata-02-first-check-suite/expected/main.stdout.txt`):

```text
PASS discounts large totals
PASS leaves small totals alone
suite: 2 tests, 0 failures
```

### Kata 03: Replace a Hand-Rolled Helper With the Library

(Concepts: co-03, co-08.)

The starter totals name lengths with an explicit loop and a mutable accumulator. Replace the loop with the library call that already does this, and keep the transcript identical. Done looks like the same totals printed from one pipeline instead of six loop lines.

**Before** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/before/starter.fsx`):

```fsharp
// => Kata 3 starter: a hand-rolled total with a loop and a mutable cell.
let names = [ "ada"; "grace"; "lin" ] // => the fixed roster under test.
// => The manual loop: index, accumulate, repeat — the library already does this.
let mutable total = 0 // => the accumulator the loop feeds.
for name in names do total <- total + name.Length // => add each length by hand.
// => The loop works; the library answers the same number in one call.
printfn "total=%d" total // => total=12, unpinned to any contract.
```

**After** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/after/solution.fsx`):

```fsharp
// => Kata 3 solution: the library call replaces the loop and the cell.
let names = [ "ada"; "grace"; "lin" ] // => the same fixed roster.
// => One pipeline: project each length, sum them, no loop, no mutable cell.
let total = names |> List.sumBy (fun s -> s.Length) // => the library answers 12.
// => Same transcript as the starter: behavior kept, machinery removed.
printfn "total=%d" total // => total=12, now pinned by Example 8's question rule.
```

**Output** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/expected/main.stdout.txt`):

```text
total=11
```

### Kata 04: Turn Nested ifs into a Pipeline

(Concepts: co-01, co-03.)

The starter nests three checks to collect passing scores. Flatten it into one pipeline where each stage names its job, keeping the printed honor roll identical. Done looks like source, filter, map, sort, join down the page with the same two names out.

**Before** (`drilling/code/kata-04-nested-if-to-pipeline/before/starter.fsx`):

```fsharp
// => Kata 4 starter: three nested checks collect the honor roll.
let scores = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the fixed table.
// => Nested branches filter, transform, and collect in one tangle.
let mutable honors: string list = [] // => the collected names, built backwards.
for (name, score) in scores do // => walk every row by hand.
    if score >= 80 then // => the filter hides inside the loop.
        let upper = name.ToUpperInvariant() // => the transform hides inside the branch.
        honors <- upper :: honors // => prepend reverses the order.
// => Reverse back and join: the pipeline stages scattered as statements.
let line = System.String.Join(", ", List.rev honors |> List.sort) // => sort repairs the order.
printfn "%s" line // => ADA, GRACE from nested branches.
```

**After** (`drilling/code/kata-04-nested-if-to-pipeline/after/solution.fsx`):

```fsharp
// => Kata 4 solution: source first, one stage per line, pipes leading.
let scores = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the same fixed table.
// => The pipeline: each stage names its job, order reads down the page.
let line = // => the honor roll, computed down the page.
    scores // => source: everything flows from here.
    |> List.filter (fun (_, s) -> s >= 80) // => stage one: keep honors only.
    |> List.map (fun (n, _) -> n.ToUpperInvariant()) // => stage two: names upcased.
    |> List.sort // => stage three: alphabetical for determinism.
    |> String.concat ", " // => stage four: one printable line.
// => Same transcript as the starter: structure changed, answers did not.
printfn "%s" line // => ADA, GRACE from one pipeline.
```

**Output** (`drilling/code/kata-04-nested-if-to-pipeline/expected/main.stdout.txt`):

```text
ADA, GRACE
```

### Kata 05: Turn a Mutable Loop into a fold

(Concepts: co-03, co-11.)

The starter counts passing scores with a mutable counter in a for loop. Replace the loop with a single fold over the same list and print the same count. Done looks like one fold with a seed of zero and no mutable cell anywhere.

**Before** (`drilling/code/kata-05-mutable-loop-to-fold/before/starter.fsx`):

```fsharp
// => Kata 5 starter: a mutable counter walks the scores by hand.
let scores = [ 72; 95; 58; 88 ] // => the fixed roster under test.
// => The manual count: a cell plus a loop where a fold belongs.
let mutable passing = 0 // => the counter the loop feeds.
for s in scores do // => walk every score by hand.
    if s >= 60 then passing <- passing + 1 // => count the passers one by one.
// => The loop works; the fold below answers the same count immutably.
printfn "passing=%d" passing // => passing=3, counted mutably.
```

**After** (`drilling/code/kata-05-mutable-loop-to-fold/after/solution.fsx`):

```fsharp
// => Kata 5 solution: one fold counts the passers with no mutable cell.
let scores = [ 72; 95; 58; 88 ] // => the same fixed roster.
// => The folder takes the count first and the score second; seed zero starts it.
let passing = List.fold (fun acc s -> if s >= 60 then acc + 1 else acc) 0 scores // => 3 passers.
// => Same transcript as the starter: the count survived, the cell did not.
printfn "passing=%d" passing // => passing=3, counted immutably.
```

**Output** (`drilling/code/kata-05-mutable-loop-to-fold/expected/main.stdout.txt`):

```text
passing=3
```

### Kata 06: Turn a Stringly Error into a Union

(Concepts: co-02.)

The starter reports grading failures as formatted strings. Convert the failure into a union case with fields and render strings only at the edge. Done looks like the same two printed lines with the failure facts readable as fields in the code.

**Before** (`drilling/code/kata-06-stringly-error-to-union/before/starter.fsx`):

```fsharp
// => Kata 6 starter: grading failures travel as formatted strings.
let grade score = // => score in, letter or complaint string out.
    // => Failures bake their facts into prose callers must re-parse.
    if score < 0 then sprintf "bad:%d" score // => stringly failure, facts baked in.
    elif score >= 90 then "A" // => the top band.
    elif score >= 60 then "C" // => the passing band.
    else "F" // => the failing band.
// => Callers print strings; the score facts are lost inside the prose.
printfn "%s %s" (grade 95) (grade -5) // => A bad:-5, facts baked into text.
```

**After** (`drilling/code/kata-06-stringly-error-to-union/after/solution.fsx`):

```fsharp
// => Kata 6 solution: failures travel as union cases with fields.
type GradeError = Negative of score: int // => the failure fact as a field.
// => The grader answers Result: letters on Ok, facts on Error.
let grade score = // => score in, tagged outcome out.
    if score < 0 then Error (Negative score) // => facts, not prose.
    elif score >= 90 then Ok "A" // => the top band.
    elif score >= 60 then Ok "C" // => the passing band.
    else Ok "F" // => the failing band.
// => Strings form only at the edge where humans read.
let show o = match o with Ok g -> g | Error (Negative s) -> sprintf "bad:%d" s // => one renderer.
printfn "%s %s" (show (grade 95)) (show (grade -5)) // => A bad:-5, facts as fields.
```

**Output** (`drilling/code/kata-06-stringly-error-to-union/expected/main.stdout.txt`):

```text
A bad:-5
```

### Kata 07: Promote a Script into a Module Plus Suite

(Concepts: co-06, co-08.)

The starter computes totals as loose top-level bindings with nothing pinning them. Promote the logic into a module and pin it with three checks through the course check helper. Done looks like the same totals printed plus a green suite summary.

**Before** (`drilling/code/kata-07-script-to-module-suite/before/starter.fsx`):

```fsharp
// => Kata 7 starter: loose bindings compute with nothing pinning them.
let qty = 12 // => the fixed quantity, floating at top level.
let rate = if qty >= 10 then 0.9 else 1.0 // => the bulk rule, also floating.
let total = float qty * 10.0 * rate // => the total, computed once, unpinned.
// => The script prints; nothing proves it stays right.
printfn "total=%.2f" total // => total=108.00, claimed not checked.
```

**After** (`drilling/code/kata-07-script-to-module-suite/after/solution.fsx`):

```fsharp
// => Kata 7 solution: logic promoted to a module, pinned by a suite.
module Billing = // => the promoted boundary: one job inside.
    // => The bulk rule, now an addressable function instead of a loose binding.
    let rate qty = if qty >= 10 then 0.9 else 1.0 // => the rule as a promise.
    // => The total, computed from the rule through one door.
    let total qty price = float qty * price * rate qty // => the single public function.
// => The suite pins the module through the course check helper.
let results = ResizeArray<string * bool>() // => the suite record.
let check name expected actual = // => compare, record, print one line.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => Three facts pin the promoted module from both sides of its boundary.
check "bulk rate" 0.9 (Billing.rate 12) // => bulk earns ten percent off.
check "small rate" 1.0 (Billing.rate 3) // => small pays full price.
check "bulk total" 108.0 (Billing.total 12 10.0) // => the module total end to end.
// => Gate and counted summary close the kata.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 3 tests, 0 failures.
```

**Output** (`drilling/code/kata-07-script-to-module-suite/expected/main.stdout.txt`):

```text
PASS bulk rate
PASS small rate
PASS bulk total
suite: 3 tests, 0 failures
```

### Kata 08: Rewrite a Translated Accent Idiomatically

(Concepts: co-14, co-01.)

The starter counts long names with an index loop in the style of another language. Rewrite it with a pipeline and the collection question rule, keeping the printed count identical. Done looks like one composed expression where the loop used to be.

**Before** (`drilling/code/kata-08-translated-accent-to-idiom/before/starter.fsx`):

```fsharp
// => Kata 8 starter: an index loop wearing another language's accent.
let names = [ "ada"; "grace"; "lin"; "hopper" ] // => the fixed roster.
// => Manual indexing walks the list like an array in another language.
let mutable long = 0 // => the counter the index loop feeds.
for i = 0 to names.Length - 1 do // => index loop over a linked list.
    let name = names.[i] // => index back into the list each time.
    if name.Length > 3 then long <- long + 1 // => count the long names.
// => The loop works; the pipeline below asks the question directly.
printfn "long=%d" long // => long=3, counted with an accent.
```

**After** (`drilling/code/kata-08-translated-accent-to-idiom/after/solution.fsx`):

```fsharp
// => Kata 8 solution: the collection question asked directly.
let names = [ "ada"; "grace"; "lin"; "hopper" ] // => the same fixed roster.
// => Name the question first — how many pass a predicate — and the function follows.
let long = names |> List.filter (fun s -> s.Length > 3) |> List.length // => the question, stated.
// => Same transcript as the starter: the accent left, the count stayed.
printfn "long=%d" long // => long=3, counted idiomatically.
```

**Output** (`drilling/code/kata-08-translated-accent-to-idiom/expected/main.stdout.txt`):

```text
long=2
```

## Self-check checklist

Twenty-four checks, at least one per concept. Every item you cannot honestly claim is a pointer back into the course — follow it before moving on.

- [ ] I can branch with `if` chains and `match` tables, ordering specific-first with guards where shapes alone cannot ask. (co-01)
- [ ] I can model absence with `Option` and chain dependent lookups through `bind`. (co-02)
- [ ] I can model handled faults with `Result` and thread them through railway chains. (co-02)
- [ ] I can raise typed exceptions for broken contracts and catch them once at the boundary. (co-02)
- [ ] I can give a retry loop an explicit attempt budget with exhaustion as a value. (co-02)
- [ ] I can pick the canonical collection function by naming the question first. (co-03)
- [ ] I can choose list, array, or sequence by access pattern and convert at boundaries. (co-03)
- [ ] I can keep sequence pipelines lazy and bound endless sources with `take`. (co-03)
- [ ] I can replace loops with `map`, `filter`, and `fold` without mutable cells. (co-03)
- [ ] I can normalize text and read fixtures through `__SOURCE_DIRECTORY__`, cleaning up fixed `/tmp` scratch. (co-04)
- [ ] I can construct dates from parts and parse them with `TryParseExact`. (co-05)
- [ ] I can organize code into modules with private helpers and one door per job. (co-06)
- [ ] I can read a project file's SDK, framework, and sources as checkable facts. (co-07)
- [ ] I can read a lock file as a dependency census and declare stdlib-only deliberately. (co-07)
- [ ] I can write check suites with recorded verdicts, tables, and a summary gate. (co-08)
- [ ] I can pin both tags of every `Result` and the blame of every raise. (co-08)
- [ ] I can join independent async stages with positions preserved. (co-09)
- [ ] I can own state in a mailbox agent and answer through reply channels. (co-09)
- [ ] I can write one generic function for every type and specialize numerics with `inline`. (co-10)
- [ ] I can use records, unions, and units of measure for structural, closed, checked data. (co-11)
- [ ] I can apply the four-layer tooling posture: format, document, exhaust, name. (co-12, co-14)
- [ ] I can call .NET libraries directly and convert collections once at the edge. (co-13)
- [ ] I can prove performance claims with deterministic operation counts. (co-15)
- [ ] I can read unfamiliar code in five passes: purpose, shapes, flow, failures, summary. (co-16)

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Explain aloud; the model answer checks you after.

### EI1: Why `Result` for parsing but exceptions for contracts?

Parsing meets input that was always allowed to be wrong, so the fault belongs to the caller to handle as data — while a broken contract means the program's own invariant failed, which only the boundary can decide. The rejected alternative — throwing for parses — would force every input boundary into `try/with` and hide the expected fault among the bugs. Data for the expected, raises for the broken: the consumer's ability to act decides the shape.

### EI2: Why `fold` over an explicit loop with a counter?

The loop spreads its intent across initialization, stepping, and accumulation, while the fold names the seed and the step in one call. The rejected alternative — the mutable loop — also destroys the intermediate evidence: with copy-and-update every stage survives for inspection, while the counter keeps only the latest value. Folds compose and loops tangle, so the shared vocabulary wins wherever the shape fits.

### EI3: Why lazy sequences over eager lists for large data?

Eager lists materialize everything before the first question is answered, which fails on endless sources and wastes work on sampled ones. The rejected alternative — `List` everywhere — computes answers nobody asks for and holds them all in memory at once. Laziness separates what to compute from how much to compute, so one pipeline serves a sample, a page, and a full export without rewriting.

### EI4: Why an agent over locks for shared counters?

Locks serialize by convention — every accessor must remember the same lock in the same order — while the agent serializes by construction, with state reachable only through the inbox. The rejected alternative — lock discipline — fails open the first time someone forgets, while the agent cannot be accessed any other way. Structure beats discipline wherever the language offers the structure.

### EI5: Why read fixtures through `__SOURCE_DIRECTORY__` instead of relative paths?

Relative paths resolve against the launch directory, which differs between laptops, containers, and CI — so the same script passes in one place and breaks in another. The rejected alternative — assuming the working directory — bakes the author's machine into every read. Source-anchored paths travel with the unit, which is the only resolution that survives every launcher.

### EI6: Why five reading passes instead of tracing line by line?

Line-by-line tracing simulates execution in the reader's head, which collapses past three stages and skips the failure paths intuition finds boring. The rejected alternative — the mental trace — produces familiarity without understanding: the reader recognizes the code without being able to change it. Ordered passes force shapes and failures into the open, which is where the understanding — and the safe edits — live.
