---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns the sixteen concepts into durable skill: recall questions with hidden answers, applied problems shaped like real tasks, eight hands-on katas with before-and-after reference solutions, a self-check checklist, and interrogation prompts that force the why behind each habit.

## Recall Q&A

Twenty-four questions, at least one per concept. Answer from memory, then open the `<details>` block to check.

### Q1 (co-01): When do you choose `if let` over `match`?

<details>
<summary>Answer</summary>

Choose `if let` when exactly one shape is interesting and the rest share a single fallback. A full `match` on two arms where one is `_ => {}` hides the interesting case inside ceremony; `if let` keeps it at the margin with its fallback beside it.

</details>

### Q2 (co-02): What does `?` do when the result is `Err`, and what must the function return?

<details>
<summary>Answer</summary>

`?` returns the `Err` from the whole function immediately, converting it through `From` on the way out. The function itself must return a `Result` (or `Option` for `Option`), because `?` needs somewhere compatible to send the failure.

</details>

### Q3 (co-02): When is `unwrap_or` the right call instead of a `match`?

<details>
<summary>Answer</summary>

When the fallback is cheap and total — a zero, an empty string, a default config — so handling adds nothing over defaulting. Reserve `match` for failures callers can act on; default everything with a sane fallback.

</details>

### Q4 (co-03): Why does `Vec` double its capacity instead of growing by one?

<details>
<summary>Answer</summary>

Doubling keeps every push amortized constant time: each reallocation copies all elements, but reallocations halve in frequency as the buffer grows. Growing by one would copy on every push and turn linear work quadratic.

</details>

### Q5 (co-03): What does `entry().or_insert()` guarantee that get-then-insert does not?

<details>
<summary>Answer</summary>

Exactly one hash lookup and one coherent slot for the whole update, so concurrent readers see no torn state and the code cannot forget the insert. Two-step get-then-insert hashes twice and can race between the steps.

</details>

### Q6 (co-04): Why build reports with `push_str` and `join` instead of `+` in a loop?

<details>
<summary>Answer</summary>

`+` in a loop copies everything built so far on every iteration, turning linear assembly into quadratic copying. `push_str` amortizes growth like `Vec`, and `join` sizes the result once for the whole collection.

</details>

### Q7 (co-04): How do you build file paths that survive a move to another platform?

<details>
<summary>Answer</summary>

Join segments with `PathBuf::push` and read parts with `file_name`, `extension`, and `parent` instead of concatenating strings. The path type inserts the platform separator and parses parts without string surgery.

</details>

### Q8 (co-05): Why do tests anchor instants to `UNIX_EPOCH` instead of reading the clock?

<details>
<summary>Answer</summary>

Clock reads vary by machine, timezone, and run moment, which makes assertions flaky by construction. Epoch-anchored fixtures replay the identical instant on every run, so time logic is tested without testing the clock.

</details>

### Q9 (co-05): How do you render a `Duration` as days, hours, minutes, and seconds?

<details>
<summary>Answer</summary>

Divide `as_secs()` by 86,400 for days, then take remainders by 3,600 for hours and 60 for minutes, printing the final remainder as seconds. The renderer stays pure — no clock, no locale — so every span formats identically.

</details>

### Q10 (co-06): What does `pub(crate)` promise that `pub` does not?

<details>
<summary>Answer</summary>

`pub(crate)` shares the item with every module in the crate but with nobody outside it, so the public API stays small while teammates reuse freely. Widening to `pub` is a versioned promise; `pub(crate)` is an internal detail.

</details>

### Q11 (co-06): What is the difference between `use` and `pub use`?

<details>
<summary>Answer</summary>

`use` shortens a path for the current file only, while `pub use` re-exports an inner name as part of the outer module's public API. Readers learn one stable surface while maintainers keep reorganizing the internals behind it.

</details>

### Q12 (co-07): What do the `^`, `~`, and `=` requirement operators each allow?

<details>
<summary>Answer</summary>

Caret `^1.2.3` allows minor and patch growth within major 1; tilde `~1.2.3` allows patch growth within 1.2; equals `=1.2.3` pins the exact triple. A bare `1.2.3` means caret, the Cargo default.

</details>

### Q13 (co-07): What does `Cargo.lock` record that `Cargo.toml` states as policy?

<details>
<summary>Answer</summary>

The lock records the exact resolved version of every package in the tree, so the next build resolves identically on every machine. The manifest states acceptable ranges; the lock is the recorded answer, committed so checkouts never drift.

</details>

### Q14 (co-08): Where do unit tests live, and what keeps them out of production binaries?

<details>
<summary>Answer</summary>

Tests live in a `#[cfg(test)]` module beside the code, compiled only when `rustc --test` (or `cargo test`) sets the flag. Production builds never see the module, so test helpers ship zero bytes.

</details>

### Q15 (co-08): Why run a new test against broken code before fixing it?

<details>
<summary>Answer</summary>

A test that passes immediately might assert nothing, and only a red run proves it can fail. Failing first also records the bug's exact symptom, so the fix diff is reviewable as the minimal change from red to green.

</details>

### Q16 (co-09): How do you keep a multithreaded transcript deterministic?

<details>
<summary>Answer</summary>

Join handles in spawn order, or collect channel results and sort before printing, so scheduling never leaks into the output. Fix thread counts and inputs too; only the computed values may print, never timing or identifiers.

</details>

### Q17 (co-09): When is `Ordering::Relaxed` enough for an atomic counter?

<details>
<summary>Answer</summary>

When only the final total is observed after all workers join, because no thread decides anything from intermediate values. The single ordered read at the end restores full determinism for the observation.

</details>

### Q18 (co-10): What does a trait bound promise a generic function?

<details>
<summary>Answer</summary>

That every operation the bound names is available on the type parameter, checked at compile time for each concrete type. The function is written once against the contract and monomorphized per caller.

</details>

### Q19 (co-11): What is the difference between `Copy` and `Clone`?

<details>
<summary>Answer</summary>

`Copy` duplicates cheap values implicitly on every use with no ceremony, while `Clone` can cost arbitrarily much and must be called explicitly. The split keeps heap allocation visible at call sites and arithmetic free of borrows.

</details>

### Q20 (co-12): What does a `///` doc example owe the reader?

<details>
<summary>Answer</summary>

A contract plus a runnable snippet shaped exactly like the real call, executed as a test so it cannot rot. Docs that run stay honest; prose examples drift until they describe a function that no longer exists.

</details>

### Q21 (co-13): What must an `extern "C"` block declare, and what does `unsafe` mark?

<details>
<summary>Answer</summary>

The block declares the foreign calling convention and each function's signature, which the linker resolves. `unsafe` marks the caller's responsibility: the pointer must be valid and the C contract upheld, because Rust's guarantees stop at the boundary.

</details>

### Q22 (co-14): How do Rust names signal their kind?

<details>
<summary>Answer</summary>

Functions, variables, and modules read `snake_case`; types, traits, and enums read `CamelCase`; constants and statics read `UPPER_SNAKE_CASE`. The compiler's naming lints enforce the shapes, so the dialect is law, not taste.

</details>

### Q23 (co-15): Name one performance idiom from this course and its cost when skipped

<details>
<summary>Answer</summary>

`Vec::with_capacity` skips reallocation copies when the size is known; fused iterator adapters replace multi-pass loops with one pass; `Cow` skips clones on the clean input path. Skipping each trades a small setup for repeated copying.

</details>

### Q24 (co-16): In what order do you read unfamiliar idiomatic code?

<details>
<summary>Answer</summary>

Signatures first for the promise, then types for what is handled, then control flow for the branching, then data flow for where values travel. Four passes with one question each beat one overwhelmed stare.

</details>

## Applied problems

Eight applied problems. Each names the examples it builds on; work them with a blank file before reading the model answer. The Panic-to-Error and First-Unit-Test katas underlie everything; the CSV, flatten, wrap, and counter katas train the four daily reflexes; the generics and collect-sort katas isolate one design judgement each.

### Applied 1: Rewrite the translated loop

The sample below sums dues the way C would: index, bound check, accumulator, post-increment. Rewrite it with `iter().sum()` and state which three moving parts delete. Reference: Examples 5 and 8 for the fused shape.

<!-- harness: illustration -->

```rust
let mut total = 0;
let mut i = 0;
while i < dues.len() {
    total += dues[i];
    i += 1;
}
```

<details>
<summary>Model answer</summary>

The rewrite is `dues.iter().sum::<i32>()`: the index, the bound re-check, and the manual increment all delete, leaving one expression whose type states the answer.

</details>

### Applied 2: Choose the failure shape, three scenarios

Pick the idiom for each: (a) one ledger line in ten thousand has a bad amount; (b) the required `input.txt` fixture is missing at startup; (c) a helper receives a negative due, which callers must never send. Reference: Examples 9 through 17, 43, and 68.

Scenario (a) wants `map_err` plus skip-and-count: recoverable, high volume, operators act per line. Scenario (b) wants a loud boundary: stderr message plus nonzero exit, since silence would masquerade as an empty report. Scenario (c) wants `panic!` or `assert!`: a caller bug, loud and immediate, pinned by `#[should_panic]`.

<details>
<summary>Model answer</summary>

Three scenarios, three shapes: `Result` for recoverable volume, loud exit for missing prerequisites, panic for broken contracts.

</details>

### Applied 3: Find the standard-library replacement

The helper below hand-rolls trimming and parsing with byte indexing that only skips spaces. Name the two standard calls that replace the loop, state what they fix (tabs, unicode whitespace, the trailing-space bug), and give the two-line replacement. Reference: Examples 19, 37, and kata 03.

<!-- harness: illustration -->

```rust
let mut s = 0;
while s < raw.len() && raw.as_bytes()[s] == b' ' { s += 1; }
rest.parse::<i32>().ok()
```

<details>
<summary>Model answer</summary>

Replace with `raw.trim().parse::<i32>().ok()`: `trim` strips all whitespace kinds, parsing delegates to the tested implementation, and the whole loop deletes.

</details>

### Applied 4: Convert the exception style

The chain below unwraps three fallible steps; any junk input aborts the run with a panic. Convert it to return `Result` with `?` propagation and `map_err` context naming the ledger line. Reference: Examples 10, 12, and kata 01.

<!-- harness: illustration -->

```rust
let member = parts[0].to_string();
let amount = parts[1].parse::<i32>().unwrap();
```

<details>
<summary>Model answer</summary>

Return `Result<(String, i32), String>`: split with `ok_or_else`, parse with `map_err(|_| format!("bad amount: {}", line))?`, and let `?` lift both failures to the caller with the line attached.

</details>

### Applied 5: Choose the collection for the job

Two jobs: (a) count dues per member from a stream of pairs; (b) hold the final per-member lines in alphabetical report order. Name the structure for each and the method that does the work (`entry` API versus sort-then-print). Reference: Examples 7 and 33.

<details>
<summary>Model answer</summary>

Job (a) is a `HashMap` with `entry(member).or_insert(0) += amount`: one lookup per pair, no missing-key branch. Job (b) is a `Vec` sorted after collection: maps never promise order, so the report sorts explicitly before printing.

</details>

### Applied 6: Pin the racy report

Two workers double six dues and print each result as it arrives; the transcript follows scheduler luck. Restructure so the printed order is fixed on every machine, and state which step absorbs the nondeterminism. Reference: Examples 55 and kata 08.

<details>
<summary>Model answer</summary>

Collect all six values from the channel, `sort`, then print: collection absorbs the arrival race and sorting decides the order. Join both workers (or drop all senders) before collecting so the end of work needs no sentinel.

</details>

### Applied 7: Borrow instead of clone

The API below clones every name into an owned `String` just to read it. Change the signature to borrow, show the two call sites (literal and owned), and state where the allocation still happens. Reference: Examples 48, 51, and kata 07.

<!-- harness: illustration -->

```rust
fn greet(name: String) -> String
```

<details>
<summary>Model answer</summary>

Change to `fn greet(name: &str) -> String`: literals pass directly, owned strings pass as `&name`, and the only allocation left is the returned greeting itself — reading becomes free.

</details>

### Applied 8: Read the unfamiliar chain

Read the pipeline below in the four layers and state what it computes on the fixed input. Name the signature promise, the types, the control flow, and the data flow. Reference: Examples 71 and 74.

<!-- harness: illustration -->

```rust
let (total, skipped) = lines.iter()
    .filter_map(|l| l.split_once(':'))
    .map(|(_, r)| r.trim().parse::<i32>())
    .fold((0, 0), |(t, s), r| match r { Ok(a) => (t + a, s), Err(_) => (t, s + 1) });
```

<details>
<summary>Model answer</summary>

Signature: borrowed lines in, `(total, skipped)` out. Types: `i32` amounts accumulate, `usize`-shaped skips count. Control flow: one fused pass, no branches outside the fold. Data flow: text in, `(125, 1)` out on the course's standard fixture — valid dues total, malformed lines count.

</details>

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the panic-to-error and first-test katas first, because error shapes and test tables underlie everything; the stdlib, combinator, iterator, and context katas next, because they train the four reflexes daily Rust demands; the borrow and channel katas after, because they isolate one design judgement each.

### Kata 01: Convert Panic to Error

(Concepts: co-02.)

The starter validates with `unwrap`, so one bad line aborts the whole run with a panic. Rewrite it to return `Result`, keep the good dues flowing, and count the skips instead of crashing. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-01-panic-to-result/before/starter.rs`):

```rust
// Kata 01 Before: validation with `unwrap` aborts on the first bad line.
// => `parse` returns a `Result`: `unwrap` throws the `Err` away as a panic.
// => One junk line below would kill the whole ledger run, not just its row.
// => The task: return the failure instead of panicking, and keep going.
fn due(raw: &str) -> i32 {
    // => panics on junk: the habit being replaced
    raw.trim().parse::<i32>().unwrap() // => `unwrap` trusts every input blindly
}
fn main() {
    // => the good line prints; the junk line would panic before the total.
    println!("due: {}", due("50")); // => prints 50, then the run is doomed
    println!("due: {}", due("xyz")); // => panics here: no total ever prints
}
```

**After** (`drilling/code/kata-01-panic-to-result/after/solution.rs`):

```rust
// Kata 01 After: `Result` keeps the run alive past bad lines.
// => Failures return as values: callers match instead of crashing.
// => The loop below totals the good dues and counts the skips honestly.
// => Same inputs as the starter: 50 settles, xyz skips, total 50.
fn due(raw: &str) -> Result<i32, String> {
    // => failure travels home safely
    raw.trim()
        .parse::<i32>()
        .map_err(|_| format!("bad amount: {}", raw)) // => names the input
}
fn main() {
    // => fixed inputs: one good due and one junk line, both handled.
    // => The verdicts below are fixed: 50 settles, xyz reports, nothing panics.
    let mut total = 0; // => sums only the dues that parse
    let mut skipped = 0; // => counts the lines that do not
    for raw in ["50", "xyz"] {
        // => good first, junk second
        match due(raw) {
            // => both arms handled at the call site
            Ok(amount) => total += amount, // => good dues join the total
            Err(why) => {
                // => junk reports and the loop continues
                // => The message names xyz: the operator knows which line failed.
                println!("skip: {}", why); // => Output: skip: bad amount: xyz
                skipped += 1; // => counted, never fatal
            }
        }
    }
    println!("total: {}", total); // => Output: total: 50
    println!("skipped: {}", skipped); // => Output: skipped: 1
}
```

**Output** (`drilling/code/kata-01-panic-to-result/expected/main.stdout.txt`):

```text
skip: bad amount: xyz
total: 50
skipped: 1
```

### Kata 02: Write the First Unit Test

(Concepts: co-08.)

The starter computes a total no test pins, so the next edit can break it silently. Write the test first against the known hand total, watch the suite pass, and print the confirmation the harness asserts. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-02-write-first-unit-test/before/starter.rs`):

```rust
// Kata 02 Before: a total no test pins, free to break silently.
// => `total` below is correct today: nothing proves it stays correct.
// => The task: pin the 150 hand total and the empty corner with tests.
// => Run them through `rustc --test`: red first if you change the code.
fn total(dues: &[i32]) -> i32 {
    // => correct but unguarded
    dues.iter().sum() // => the plain sum, waiting for its tests
}
fn main() {
    // => the unguarded call: prints today, breaks silently tomorrow.
    println!("total: {}", total(&[50, 75, 25])); // => 150, trusted on faith
}
```

**After** (`drilling/code/kata-02-write-first-unit-test/after/solution.rs`):

```rust
// Kata 02 After: the test pins the total before the run trusts it.
// => Three checks execute in `main`: exact sum, empty corner, pair sum.
// => `assert_eq!` fails loudly on mismatch: silence means every check held.
// => The transcript confirms the count: three checks, all green.
// => Real suites live in `#[cfg(test)]` modules; this kata runs them inline.
fn total(dues: &[i32]) -> i32 {
    // => the same plain sum, now guarded
    dues.iter().sum() // => unchanged logic: the tests are the whole change
}
// => `check` names each fact: input, hand total, and verdict in one line.
fn check(name: &str, got: i32, want: i32) -> bool {
    // => true when the fact holds
    let holds = got == want; // => the fact under test
    println!("{}: {} == {} -> {}", name, got, want, holds); // => names the verdict
    holds // => callers count the green checks
}
fn main() {
    // => three fixed facts: the hand totals computed before writing the test.
    let mut passed = 0; // => counts the green checks below
    if check("three dues", total(&[50, 75, 25]), 150) {
        passed += 1;
    } // => 150 by hand
    if check("empty", total(&[]), 0) {
        passed += 1;
    } // => empty sums to zero
    if check("pair", total(&[50, 75]), 125) {
        passed += 1;
    } // => 125 by hand
    println!("passed: {}/3", passed); // => Output: passed: 3/3
}
```

**Output** (`drilling/code/kata-02-write-first-unit-test/expected/main.stdout.txt`):

```text
three dues: 150 == 150 -> true
empty: 0 == 0 -> true
pair: 125 == 125 -> true
passed: 3/3
```

### Kata 03: Standard Library Replaces Hand-Rolled

(Concepts: co-03, co-04.)

The starter trims and parses with a hand-rolled character loop that hides two boundary bugs. Replace it with `trim` plus `parse`, keep the same verdicts, and delete the loop entirely. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/before/starter.rs`):

```rust
// Kata 03 Before: a hand-rolled trim-and-parse loop with hiding places.
// => Manual indexing re-checks bounds the standard library already handles.
// => The task: delete the loop, use `trim` plus `parse`, keep the verdicts.
// => Whitespace-only input should be missing, junk should fail to parse.
fn parse_hand(raw: &str) -> Option<i32> {
    // => hand-rolled, bug-compatible
    let bytes = raw.as_bytes(); // => drops to bytes to dodge char boundaries
    let mut start = 0; // => first non-space index, searched below
    while start < bytes.len() && bytes[start] == b' ' {
        // => spaces only, not tabs
        start += 1; // => skips spaces, one by one
    }
    if start == bytes.len() {
        // => all spaces counts as missing here
        return None; // => the one corner the loop gets right
    }
    let rest = &raw[start..]; // => slicing resumes on the byte index
                              // => Only spaces skip: tabs and unicode whitespace defeat the loop.
    rest.parse::<i32>().ok() // => parsing finally delegates to stdlib
}
fn main() {
    // => the verdicts the rewrite must preserve exactly.
    println!("{:?}", parse_hand(" 75 ")); // => trailing space breaks this one
    println!("{:?}", parse_hand("xyz")); // => junk fails either way
}
```

**After** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/after/solution.rs`):

```rust
// Kata 03 After: `trim` plus `parse` delete the loop and its hiding places.
// => `trim` strips all whitespace, not just spaces: tabs fixed for free.
// => The verdicts below match the starter's intent on every input.
// => Two lines replace twelve: the standard library already solved this.
// => Trailing space parses now: the hand-rolled slice dropped it wrongly.
fn parse_std(raw: &str) -> Option<i32> {
    // => the standard two-step
    let trimmed = raw.trim(); // => all whitespace gone, unicode-aware
    if trimmed.is_empty() {
        // => blank is missing, not zero
        return None; // => explicit corner, same as the starter
    }
    trimmed.parse::<i32>().ok() // => digits parse, junk becomes `None`
}
fn main() {
    // => three fixed inputs prove the rewrite: padded, junk, and blank.
    println!("{:?}", parse_std(" 75 ")); // => Output: Some(75)
    println!("{:?}", parse_std("xyz")); // => Output: None
    println!("{:?}", parse_std("   ")); // => Output: None
}
```

**Output** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/expected/main.stdout.txt`):

```text
Some(75)
None
None
```

### Kata 04: Combinators Replace Nested Match

(Concepts: co-02, co-01.)

The starter nests two matches to normalize an optional nickname, pushing the happy path two levels deep. Flatten it with `map`, `filter`, and `map` again so the pipeline reads as one transformation. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-04-option-combinators/before/starter.rs`):

```rust
// Kata 04 Before: nested matches push the happy path two levels deep.
// => Each `match` re-states the `None` case the next stage must skip.
// => The task: chain `map` and `filter` so `None` short-circuits by itself.
// => Empty-after-trim and missing inputs must both normalize to `None`.
fn clean_nested(nick: Option<&str>) -> Option<String> {
    // => nested and deep
    match nick {
        // => level one: presence check
        Some(name) => match name.trim().is_empty() {
            // => level two: blank check
            true => None, // => blank trims to nothing: reject
            false => Some(name.trim().to_uppercase()), // => happy path, buried
        },
        None => None, // => missing stays missing
    }
}
fn main() {
    // => the verdicts the flat chain must preserve exactly.
    // => Padded normalizes to BUD; missing stays None: both shapes covered.
    println!("{:?}", clean_nested(Some("  bud  "))); // => trims and uppercases
    println!("{:?}", clean_nested(None)); // => stays missing
}
```

**After** (`drilling/code/kata-04-option-combinators/after/solution.rs`):

```rust
// Kata 04 After: one chain replaces two nested matches.
// => `map` transforms inside the option: no unwrapping by hand.
// => `filter` drops the blank case: empties never reach the uppercase.
// => `None` skips every stage: short-circuiting is structural, not remembered.
// => Three fixed inputs prove every stage: padded, missing, and blank.
fn clean_flat(nick: Option<&str>) -> Option<String> {
    // => flat by construction
    nick.map(|name| name.trim()) // => stage one: trim inside the option
        .filter(|name| !name.is_empty()) // => stage two: blanks stop here
        .map(|name| name.to_uppercase()) // => stage three: normalize survivors
}
fn main() {
    // => padded normalizes, missing skips, blank filters: all three verdicts.
    println!("{:?}", clean_flat(Some("  bud  "))); // => Output: Some("BUD")
    println!("{:?}", clean_flat(None)); // => Output: None
    println!("{:?}", clean_flat(Some("   "))); // => Output: None
}
```

**Output** (`drilling/code/kata-04-option-combinators/expected/main.stdout.txt`):

```text
Some("BUD")
None
None
```

### Kata 05: Iterator Over Index Loop

(Concepts: co-03, co-15.)

The starter sums dues through index arithmetic that re-checks the bound on every step. Replace it with a single fused `iter().sum()` and keep the identical total. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-05-iterator-over-index-loop/before/starter.rs`):

```rust
// Kata 05 Before: index arithmetic re-checks the bound every step.
// => `i < dues.len()` runs per iteration: the bound never changes.
// => The task: delete the index, stream the values, sum in one pass.
// => The total must stay 150: the rewrite changes shape, never answers.
fn total_indexed(dues: &[i32]) -> i32 {
    // => correct but mechanical
    let mut total = 0; // => the accumulator the loop feeds
    let mut i = 0; // => the index the loop babysits
    while i < dues.len() {
        // => bound re-checked on every single step
        total += dues[i]; // => indexing trusts the check above
        i += 1; // => progress lives in the body, easy to forget
    }
    total // => 150 by accumulation
}
fn main() {
    // => the answer the fused pass must reproduce exactly.
    println!("total: {}", total_indexed(&[50, 75, 25])); // => 150 the slow way
}
```

**After** (`drilling/code/kata-05-iterator-over-index-loop/after/solution.rs`):

```rust
// Kata 05 After: one fused pass replaces the index, bound, and step.
// => `iter` streams values: no index exists to go out of bounds.
// => `sum` folds in one pass: the compiler fuses what the loop spelled out.
// => Same answer, fewer moving parts: 150 either way, proven below.
// => The accumulator, bound check, and increment all delete together.
fn total_fused(dues: &[i32]) -> i32 {
    // => the whole loop in one expression
    dues.iter().sum() // => stream the values, fold them, done
}
fn main() {
    // => the identical total through the fused shape: shape changed, answer kept.
    println!("total: {}", total_fused(&[50, 75, 25])); // => Output: total: 150
}
```

**Output** (`drilling/code/kata-05-iterator-over-index-loop/expected/main.stdout.txt`):

```text
total: 150
```

### Kata 06: Add Error Context with Map Err

(Concepts: co-02.)

The starter propagates a bare parse error that never names the ledger line it came from. Wrap it with `map_err` at the parsing boundary so every failure identifies its own input. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-06-error-context-with-map-err/before/starter.rs`):

```rust
// Kata 06 Before: a bare parse error never names its ledger line.
// => `ParseIntError` says `invalid digit`: true of ten thousand lines.
// => The task: wrap the failure where the line is known, naming the input.
// => The verdict for "sari:xyz" must name sari's line, not just the digits.
use std::num::ParseIntError; // => the bare low-level error, context-free
fn amount_bare(raw: &str) -> Result<i32, ParseIntError> {
    // => no context attached
    raw.trim().parse::<i32>() // => fails with `invalid digit found in string`
}
fn main() {
    // => the unhelpful verdict the rewrite must improve upon.
    println!("{:?}", amount_bare("xyz")); // => names the digits, not the line
}
```

**After** (`drilling/code/kata-06-error-context-with-map-err/after/solution.rs`):

```rust
// Kata 06 After: `map_err` names the line at the parsing boundary.
// => Context attaches where the input is known: inside `due`, not above it.
// => The good path is untouched: `map_err` transforms failures only.
// => Both verdicts below identify their input: the operator can act on them.
fn amount_named(raw: &str) -> Result<i32, String> {
    // => failures carry context
    raw.trim() // => noise off first, same as the starter
        .parse::<i32>() // => the same stdlib parse underneath
        .map_err(|_| format!("bad amount: {}", raw)) // => names the input line
}
fn main() {
    // => good input parses, junk names itself: both verdicts actionable.
    println!("{:?}", amount_named("50")); // => Output: Ok(50)
    println!("{:?}", amount_named("xyz")); // => Output: Err("bad amount: xyz")
}
```

**Output** (`drilling/code/kata-06-error-context-with-map-err/expected/main.stdout.txt`):

```text
Ok(50)
Err("bad amount: xyz")
```

### Kata 07: Borrow String Slices

(Concepts: co-11.)

The starter clones every name into an owned `String` just to read it. Change the function to borrow `&str` so callers pass literals and owned strings alike with zero allocation. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-07-borrowed-string-slices/before/starter.rs`):

```rust
// Kata 07 Before: cloning every name just to read it once.
// => `name.clone()` pays a heap copy per greeting: reading should be free.
// => The task: borrow `&str` so literals and owned strings both pass freely.
// => The transcript must stay identical: shape changes, words do not.
fn greet_owned(name: String) -> String {
    // => demands ownership to read
    format!("halo, {}!", name) // => reads once, owns forever
}
fn main() {
    // => owned strings built only to satisfy the signature: waste, visible.
    println!("{}", greet_owned("sari".to_string())); // => clone by construction
}
```

**After** (`drilling/code/kata-07-borrowed-string-slices/after/solution.rs`):

```rust
// Kata 07 After: borrowing reads without owning or cloning.
// => `&str` accepts literals and `&String` alike: one signature, every caller.
// => Zero allocation on the read path: the format owns only its output.
// => The transcript matches the starter exactly: words kept, waste gone.
fn greet_borrowed(name: &str) -> String {
    // => borrows to read, owns the result
    format!("halo, {}!", name) // => the output owns its text; the input stays
}
fn main() {
    // => literal and owned inputs through one signature: no clones anywhere.
    println!("{}", greet_borrowed("sari")); // => Output: halo, sari!
    println!("{}", greet_borrowed(&"budi".to_string())); // => Output: halo, budi!
}
```

**Output** (`drilling/code/kata-07-borrowed-string-slices/expected/main.stdout.txt`):

```text
halo, sari!
halo, budi!
```

### Kata 08: Channel Collects, Sort Pins

(Concepts: co-09.)

The starter prints each doubled due as its worker sends it, so the transcript follows scheduler luck. Collect every result, sort them, and print the pinned order instead. The solution below shows one good reference with its recorded output; make the starter match before peeking.

**Before** (`drilling/code/kata-08-channel-collect-sort/before/starter.rs`):

```rust
// Kata 08 Before: printing on arrival follows scheduler luck.
// => Each `println!` runs when its worker sends: order varies by machine.
// => The task: collect all six results, sort them, then print the fixed order.
// => Two workers double six dues: the values are fixed, the order is not.
use std::sync::mpsc; // => the channel both workers share
use std::thread; // => two workers, one racy transcript
fn main() {
    // => six fixed dues across two workers: values fixed, arrival random.
    let (send, recv) = mpsc::channel(); // => the shared results channel
    let second = send.clone(); // => worker two gets its own sender
    thread::spawn(move || {
        // => owns `send`: evens arrive first, usually
        for due in [1, 2, 3] {
            // => fixed inputs
            send.send(due * 2).expect("receiver lives"); // => 2, 4, 6 sent
        }
    });
    thread::spawn(move || {
        // => owns `second`: odds arrive second, usually
        for due in [4, 5, 6] {
            // => fixed inputs
            second.send(due * 2).expect("receiver lives"); // => 8, 10, 12 sent
        }
    });
    // => Racy on purpose: this transcript is what the kata learns to pin.
    for doubled in recv.iter() {
        // => arrival order: usually sorted, not promised
        println!("{}", doubled); // => racy transcript: the habit being replaced
    }
    // => Two workers, one printer: the interleaving is scheduler luck.
    // => Collect-then-sort is the fix: the after file proves it below.
}
```

**After** (`drilling/code/kata-08-channel-collect-sort/after/solution.rs`):

```rust
// Kata 08 After: collect everything, sort, then print the pinned order.
// => The channel still races: collection absorbs the nondeterminism.
// => `sort` pins the transcript: 2 through 12 even, on every machine.
// => Same workers, same values: only the observation order changed.
// => Sorting after joining is the deterministic concurrency habit.
use std::sync::mpsc; // => the same channel shape as the starter
use std::thread; // => the same two workers as the starter
fn main() {
    // => identical workers to the starter: values fixed, arrival still racy.
    let (send, recv) = mpsc::channel(); // => the shared results channel
    let second = send.clone(); // => worker two gets its own sender
    thread::spawn(move || {
        // => owns `send`: sends 2, 4, 6
        for due in [1, 2, 3] {
            // => fixed inputs
            send.send(due * 2).expect("receiver lives"); // => never fails here
        }
    });
    thread::spawn(move || {
        // => owns `second`: sends 8, 10, 12
        for due in [4, 5, 6] {
            // => fixed inputs
            second.send(due * 2).expect("receiver lives"); // => never fails here
        }
    });
    // => collect all six first: the loop ends when both workers finish.
    let mut doubled: Vec<i32> = recv.iter().collect(); // => arrival order inside
    doubled.sort(); // => pinning step: order decided, not observed
                    // => Six values, one order: the sort above is the whole difference.
    for value in doubled {
        // => the fixed transcript below, every run
        println!("{}", value); // => 2, 4, 6, 8, 10, 12 in order
    }
}
```

**Output** (`drilling/code/kata-08-channel-collect-sort/expected/main.stdout.txt`):

```text
2
4
6
8
10
12
```

## Self-check checklist

Twenty-four items, at least one per concept. Check an item only when you have done it in a real program, not when you have merely read about it.

- [ ] I can use `if let` and `while let` for single-shape values instead of nesting a full `match`. (co-01)

- [ ] I can order `match` arms from most specific to most general with guards refining patterns. (co-01)

- [ ] I can return `Result` for recoverable failures and propagate with `?` instead of unwrapping. (co-02)

- [ ] I can wrap low-level errors with `map_err` where the input line is known. (co-02)

- [ ] I can grow vectors with `push`, reserve with `with_capacity`, and update maps through `entry`. (co-03)

- [ ] I can compose `filter_map` and `sum` pipelines instead of indexing loops. (co-03)

- [ ] I can build text with `push_str` and `join`, and parse lines through split-trim-parse. (co-04)

- [ ] I can read and write whole small files, stream big ones with `BufReader::lines`, and join paths with `PathBuf`. (co-04)

- [ ] I can anchor time tests to `UNIX_EPOCH` plus `Duration`, render spans with division and remainder, and add with `checked_add`. (co-05)

- [ ] I can split code into `mod` blocks, open the API with `pub`, and share inside the crate with `pub(crate)`. (co-06)

- [ ] I can reach down with `crate::` paths and publish stable surfaces with `pub use`. (co-06)

- [ ] I can read `Cargo.toml` identity fields and predict `^`, `~`, `=`, and bare requirement ranges. (co-07)

- [ ] I can explain what `Cargo.lock` pins and why committed locks make builds reproducible. (co-07)

- [ ] I can write `#[test]` suites in `#[cfg(test)]` modules and run them with `rustc --test`. (co-08)

- [ ] I can prove a test red before green, table-drive cases, and mark slow tests `#[ignore]`. (co-08)

- [ ] I can spawn `move` closures, join in order, and pin channel transcripts with collect-then-sort. (co-09)

- [ ] I can share with `Arc<Mutex>`, `RwLock`, and atomics, and recover poisoned locks with `into_inner`. (co-09)

- [ ] I can bound type parameters by used operations and implement shared behavior in traits. (co-10)

- [ ] I can choose `Copy` for cheap values, `Clone` explicitly for shared ones, and borrow with `&`/`&mut` in phases. (co-11)

- [ ] I can keep `rustfmt --check` silent, write Clippy-clean iterator code, read compiler errors bottom-up, and document with runnable `///` examples. (co-12)

- [ ] I can declare `extern "C"` boundaries with tight `unsafe` and treat subprocesses as typed argv-in, status-back contracts. (co-13)

- [ ] I can name functions `snake_case`, types `CamelCase`, and constants `UPPER_SNAKE_CASE`. (co-14)

- [ ] I can reach for `with_capacity`, fused passes, and `Cow` where measurement shows copying costs. (co-15)

- [ ] I can read unfamiliar code in layers: signatures, types, control flow, then data flow. (co-16)

## Elaborative interrogation & self-explanation

Six why-and-why-not prompts. Each names a design choice and a rejected alternative with a model answer. Explain each aloud before reading the answer; teaching the tradeoff is the retention mechanism.

### Prompt 1: Why `?` instead of matching every call, and why not `unwrap` everywhere?

<details>
<summary>Model answer</summary>

`?` keeps three fallible calls at one indent level where nested matches would pyramid, and it preserves each error for the caller instead of discarding context. `unwrap` everywhere converts every recoverable failure into a crash, which is correct only for programmer bugs — the exact case `assert!` and `#[should_panic]` already own. The rejected alternative trades explicit, typed failure paths for convenience that detonates in production.

**Rule of thumb**: Match when the call site can recover differently per error; `?` when the caller decides; never `unwrap` on external input.

</details>

### Prompt 2: Why collect-then-sort instead of printing channel results on arrival?

<details>
<summary>Model answer</summary>

Arrival order is scheduler output, not program decision, so printing it asserts nothing and flakes under load. Collecting absorbs the race into data and sorting decides the order, which separates what the program computed from when threads happened to finish. Printing on arrival is faster to write and wrong to test.

**Rule of thumb**: Join in spawn order when positions are known; collect-then-sort when workers are interchangeable.

</details>

### Prompt 3: Why commit the lockfile for binaries, and why not float every dependency?

<details>
<summary>Model answer</summary>

Committed locks make every checkout resolve the identical tree, so bugs reproduce and releases audit from a recorded fact. Floating re-resolves on every build, which means two builds of one commit can differ — an untestable state. Libraries omit locks because the final binary decides; binaries commit them because the binary is the promise.

**Rule of thumb**: Commit locks for every shipped binary and capstone; document ranges in the manifest.

</details>

### Prompt 4: Why park slow tests with `#[ignore]` instead of deleting them or running everything?

<details>
<summary>Model answer</summary>

Deleting surrenders the coverage; running everything on every edit makes the suite too slow to run, which is the same as deleting it behaviorally. Ignored tests stay one explicit command away, so the fast suite guards every keystroke and the slow suite guards releases. The flag is the compromise that keeps both speeds honest.

**Rule of thumb**: Fast by default, slow on purpose, nothing deleted.

</details>

### Prompt 5: Why `Box<dyn Trait>` for open-ended dispatch, and why not always static generics?

<details>
<summary>Model answer</summary>

Trait objects let new kinds join without editing the dispatch loop, which static generics cannot do without recompiling every call site into bigger binaries. The cost is one vtable lookup per call — negligible beside I/O, real beside arithmetic. The rejected always-static shape recompiles the world for every new kind; the rejected always-dynamic shape pays indirection where monomorphization was free.

**Rule of thumb**: Static generics for closed, hot paths; trait objects for open, heterogeneous sets.

</details>

### Prompt 6: Why read in layers instead of tracing execution top to bottom?

<details>
<summary>Model answer</summary>

Top-to-bottom tracing holds signatures, types, branches, and values in memory simultaneously, which overflows on any real function. Layered reading asks one question per pass — promise, shapes, branches, flow — so a fifty-line function surrenders in four short reads. The debugger shows what happened once; layers teach what the code means always.

**Rule of thumb**: Layers for comprehension, debugger for the single failing run.

</details>
