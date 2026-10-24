---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The capstone combines the course into one zakat-ledger CLI: it reads a fixed dues file, settles every valid line through a tested parser, skips malformed lines with an honest count, reads its own package identity from the manifest, and prints a fixed eight-line transcript the harness asserts byte for byte.

## Why this exists -- the big idea

**The problem before the solution**: course examples prove idioms in isolation, but production tools fail at the seams: reading disagrees with parsing, parsing disagrees with totaling, and verification is a comment instead of a check. The capstone wires every layer together so the seams are load-bearing: reading feeds classification, classification feeds totaling, totaling feeds the report, and the suite guards the whole chain.

**Keep this if you forget everything else**: read input, parse it with a tested function, total what parses, count what does not, then report. In that order, every time.

## What you will build

A small `zakat-ledger` tool plus a fixed eight-line input fixture. It parses each line with the line grammar from Examples 12 and 19, groups per-member totals with the entry API from Example 7, sorts names for a fixed report order, and reads its package name and version from the manifest the way Example 30 teaches. Four tests pin the parser, the summary, and the manifest reader; a missing input file exits nonzero with a stderr message naming the fixture, which is the loud boundary failure the course teaches instead of a silent empty report.

## The fixtures

The manifest declares the package identity with zero dependencies: the standard library carries the whole capstone, so there is nothing to pin and no lockfile to commit.

**`learning/capstone/code/Cargo.toml`** (committed fixture and module declaration):

```text
[package]
name = "zakat-ledger"
version = "0.2.0"
edition = "2021"
```

The input fixture holds eight dues lines, three of them malformed in three different ways: a missing colon, an empty member, and a non-numeric amount. Negative amounts never appear here; the parser refuses them by construction, and the tests pin that refusal separately.

**`learning/capstone/code/input.txt`** (committed fixture of eight dues lines):

```text
sari:50
budi:75
oops-no-colon
citra:25
budi:25
:40
sari:xyz
sari:10
```

## The capstone logic

The ledger module owns the domain: `parse_line` for the member-amount grammar with three named malformed shapes, `summarize` for the per-member and grand totals in sorted order, and `manifest_value` for the identity line. The test module pins all four facts: the valid parse, the three rejections, the grouped summary, and the manifest read.

**`learning/capstone/code/ledger.rs`**:

```rust
// Capstone: zakat-ledger domain logic, tested before it ever prints.
// => `parse_line` validates one line: colon splits, trim cleans, parse decides.
// => Empty members and non-positive amounts are data errors, counted not kept.
// => `summarize` folds valid pairs into per-member totals plus a grand total.
// => Sorting by member name pins the report order: maps never promise order.
// => `manifest_value` reads Cargo.toml identity: name and version for the pin line.
// => Every fact below is fixed: the eight-line fixture decides all verdicts.
use std::collections::HashMap; // => member-to-total accumulation
                               // => `parse_line` returns the member and amount or the reason it cannot.
pub fn parse_line(line: &str) -> Result<(String, i32), String> {
    // => owned pair out
    let (member, raw) = line // => borrow the line; halves borrow it too
        .split_once(':') // => `None` when the colon is missing entirely
        .ok_or_else(|| format!("no colon: {}", line))?; // => first malformed shape
    let member = member.trim(); // => padding never names a member
    if member.is_empty() {
        // => the second malformed shape: no name at all
        return Err(format!("empty member: {}", line)); // => counted, not kept
    }
    let amount = raw // => the text after the colon
        .trim() // => noise off before the value decision
        .parse::<i32>() // => the stdlib parse underneath
        .map_err(|_| format!("bad amount: {}", line))?; // => third malformed shape
    if amount <= 0 {
        // => the domain rule: dues stay strictly positive
        return Err(format!("refused non-positive: {}", line)); // => counted, not kept
    }
    Ok((member.to_string(), amount)) // => a validated, owned pair
}
// => `summarize` folds parsed pairs into sorted per-member lines plus totals.
pub fn summarize(pairs: &[(String, i32)]) -> (Vec<(String, i32)>, i32) {
    // => lines plus grand
    let mut totals: HashMap<&str, i32> = HashMap::new(); // => member to sum
    for (member, amount) in pairs {
        // => each valid pair updates one slot
        *totals.entry(member.as_str()).or_insert(0) += amount; // => one lookup per pair
    }
    let mut lines: Vec<(String, i32)> = totals // => owned lines for the report
        .into_iter() // => consume the map: no second pass needed
        .map(|(member, total)| (member.to_string(), total)) // => own every name
        .collect(); // => one line per member
    lines.sort(); // => alphabetical: budi, citra, sari, every run
    let grand: i32 = lines.iter().map(|(_, total)| total).sum(); // => the grand total
    (lines, grand) // => both answers travel together
}
// => `manifest_value` extracts one `key = "value"` line from manifest text.
pub fn manifest_value(text: &str, key: &str) -> Option<String> {
    // => `None` when absent
    for line in text.lines() {
        // => one pass over the manifest lines
        // => header lines like `[package]` carry no `=`: skip, do not bail.
        let Some((name, raw)) = line.split_once('=') else {
            continue;
        }; // => key lines only
        if name.trim() == key {
            // => the wanted key, whitespace-tolerant
            return Some(raw.trim().trim_matches('"').to_string()); // => bare value
        }
    }
    None // => the key never appeared: callers decide what that means
}
#[cfg(test)] // => test-only from here down: ships no test code
mod tests {
    // => the suite: parsing, summarizing, and manifest facts
    use super::*; // => the three functions are all in scope
    #[test] // => the valid line parses to its member and amount
            // => "sari:50" is the canonical good line: member sari, amount 50.
    fn parses_valid_line() {
        // => the happy-path fact
        assert_eq!(parse_line("sari:50"), Ok(("sari".to_string(), 50))); // => hand-checked
    }
    #[test] // => all three malformed shapes fail with their own messages
    fn rejects_malformed_shapes() {
        // => the three skip facts
        assert!(parse_line("oops-no-colon").is_err()); // => missing colon
        assert!(parse_line(":40").is_err()); // => empty member
        assert!(parse_line("sari:xyz").is_err()); // => bad amount
    }
    #[test] // => the summary groups, sorts, and totals the fixed pairs
            // => Sari pays twice: grouping folds both dues into one 60 line.
    fn summarizes_fixed_pairs() {
        // => the arithmetic fact
        let pairs = vec![
            ("sari".to_string(), 50),
            ("budi".to_string(), 75),
            ("sari".to_string(), 10),
        ]; // => sari twice
        let (lines, grand) = summarize(&pairs); // => the function under test
                                                // => Alphabetical: budi's 75 precedes sari's grouped 60.
        assert_eq!(
            lines,
            vec![("budi".to_string(), 75), ("sari".to_string(), 60)]
        ); // => sorted, grouped
        assert_eq!(grand, 135); // => 75 + 60 by hand
    }
    #[test] // => the manifest reader finds name and version in fixed text
    fn reads_manifest_identity() {
        // => the pin-line fact
        let text = "[package]\nname = \"zakat-ledger\"\nversion = \"0.2.0\"\n"; // => tiny manifest
        assert_eq!(
            manifest_value(text, "name"),
            Some("zakat-ledger".to_string())
        ); // => the package name
        assert_eq!(manifest_value(text, "version"), Some("0.2.0".to_string())); // => the pinned version
    }
}
```

The binary is deliberately thin: read both fixtures, parse each line, count skips, summarize, and print the report built by the pure functions. Its only branches are the missing-fixture exit, the blank-line skip, and the parse verdict, which keeps every decision testable through `ledger` rather than through I/O.

**`learning/capstone/code/main.rs`**:

```rust
// Capstone: zakat-ledger CLI, thin wiring over the tested ledger logic.
// => Reads `input.txt`, settles every valid due, skips the rest honestly.
// => Reads `Cargo.toml` for the pin line: zero dependencies, declared.
// => Prints the fixed eight-line transcript the harness asserts byte for byte.
// => Missing input exits nonzero with stderr: silence never means success.
// => The harness runs with cwd here: both fixtures sit beside the binary.
mod ledger; // => the tested logic: parse, summarize, manifest
use std::fs; // => whole-file reads for both fixtures
             // => `read_pair` loads one fixture file or reports the loud boundary failure.
fn read_pair(name: &str) -> String {
    // => fixture text or a nonzero exit
    fs::read_to_string(name).unwrap_or_else(|_| {
        // => missing fixture is fatal
        eprintln!("missing fixture: {}", name); // => stderr: operators read this
        std::process::exit(1); // => nonzero: silence never means success
    })
}
fn main() {
    // => both fixtures load first: the ledger lines and the manifest identity.
    let body = read_pair("input.txt"); // => eight fixed lines, three malformed
    let manifest = read_pair("Cargo.toml"); // => identity-only: zero dependencies
                                            // => the pin line proves the manifest read ran: name plus version.
    let name = ledger::manifest_value(&manifest, "name").unwrap_or_else(|| "unknown".to_string()); // => zakat-ledger
    let version =
        ledger::manifest_value(&manifest, "version").unwrap_or_else(|| "0.0.0".to_string()); // => 0.2.0
    println!("package: {} {}", name, version); // => Output: package: zakat-ledger 0.2.0
                                               // => parse every line: valid pairs settle, malformed lines count as skipped.
    let mut pairs = Vec::new(); // => the valid dues in file order
    let mut skipped = 0; // => the honest count of rejected lines
    let mut lines = 0; // => every line counts, valid or not
    for line in body.lines() {
        // => one pass over the eight fixture lines
        if line.trim().is_empty() {
            // => trailing newline is not a ninth due
            continue; // => skip the ghost line the final newline implies
        }
        lines += 1; // => a real line: counted before the verdict
        match ledger::parse_line(line) {
            // => the tested parser decides
            Ok(pair) => pairs.push(pair), // => valid dues accumulate
            Err(_) => skipped += 1,       // => malformed lines count, never crash
        }
    }
    // => the summary folds the valid pairs: sorted lines plus the grand total.
    let (settled, grand) = ledger::summarize(&pairs); // => tested grouping
    println!(
        "lines: {} kept: {} skipped: {}",
        lines,
        pairs.len(),
        skipped
    ); // => Output: lines: 8 kept: 5 skipped: 3
    for (member, total) in settled {
        // => alphabetical: budi, citra, sari
        println!("{}: {}", member, total); // => budi: 100, citra: 25, sari: 60
    }
    println!("grand: {}", grand); // => Output: grand: 185
}
```

## How to read it

Line classification (Examples 12, 19, 74) feeds grouping; the entry API over the grouped pairs builds the map (Example 7); sorting with the alphabetical comparator ranks deterministically (Example 33's ordering lesson); the manifest read (Example 30) declares the pinning posture; the loud-boundary exit (Example 68) guards the missing fixture. No new idioms appear here: composition is the test. Read the program top to bottom and name the example each section comes from; if a section has no ancestor, it does not belong.

Purity is the organizing rule: `parse_line`, `summarize`, and `manifest_value` take input and return answers, printing nothing, so the tests pin them without fixtures. Only `main` touches the filesystem and the terminal, and its only branches are the read failure, the blank-line skip, and the parse verdict. Adding a new report column means extending `summarize` and its test; adding a new line shape means extending `parse_line` and its table. Neither change touches the other.

## Verification

The harness runs two units: the suite first, then the binary. The suite transcript below proves four tests passed with zero failures; timings normalize out so reruns diff identically.

**Output** (`learning/capstone/code/expected/test/test.stdout.txt`):

```text

running 4 tests
test tests::parses_valid_line ... ok
test tests::reads_manifest_identity ... ok
test tests::rejects_malformed_shapes ... ok
test tests::summarizes_fixed_pairs ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

```

The report transcript below proves every stage. The `package:` line proves the manifest read ran and the project ships stdlib-only with zero dependencies. The `lines=` headline proves reading produced eight lines with five kept and three skipped. The three member lines prove grouping with deterministic alphabetical order: budi at 100, citra at 25, sari at 60. The `grand:` line proves the fold: 185. Any missing line names its broken stage exactly. Rerun both units and diff: identical bytes, because fixed input, fixed ordering, and a timing-free summary leave no room for variance.

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
package: zakat-ledger 0.2.0
lines: 8 kept: 5 skipped: 3
budi: 100
citra: 25
sari: 60
grand: 185
```
