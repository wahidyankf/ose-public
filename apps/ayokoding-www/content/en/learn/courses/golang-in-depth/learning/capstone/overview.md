---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Gali settles a small dues ledger: member dues in, settlement report out. It reads `input.txt`, skips malformed lines with an honest count, and prints per-member totals, a grand total, and the skipped-line count. The capstone is complete when `go vet`, `go test`, and the binary all pass and the printed transcript matches the golden output below byte for byte.

## What you will build

Gali is a dues-ledger reporter: it reads member dues from input.txt, skips malformed lines with an honest count, and prints a settlement report with per-member totals, a grand total, and the skipped-line count. It exercises every habit this course teaches: idiomatic error handling with wrapped failures, standard-library-only I/O and sorting, table-driven tests over the line grammar, and a go.mod that pins the toolchain with zero require lines.

The report for the committed fixture settles three members from five valid lines, skips three malformed lines in three distinct ways (no colon, empty member, non-numeric amount), and names every figure so the treasurer can verify each one by hand. Negative amounts are refused outright: dues only grow ledgers, so a minus sign is a data error, not a refund.

## Architecture

The capstone is four files with one job each. ledger.go owns the domain: the Due type, parseLine for the member:amount grammar, and summarize for the per-member and grand totals. ledger_test.go pins both with a table test over five line shapes and a folding test over a fixed three-due ledger. main.go is deliberately thin: read input.txt, split lines, parse each one, count skips, summarize, and print the report built by the pure report function. input.txt is the fixed fixture: eight dues lines, three of them malformed in three different ways, so the transcript proves the skipping contract instead of merely claiming it.

Purity is the organizing rule: parseLine, summarize, and report take input and return answers, printing nothing, so the tests pin them without fixtures. Only main touches the filesystem and the terminal, and its only branches are the read failure, the blank-line skip, and the parse verdict. Adding a new report column means extending report and its test; adding a new line shape means extending parseLine and its table. Neither change touches the other.

## Files

The module pins the toolchain with zero require lines: the standard library carries the whole capstone, so there is nothing to audit or update.

**`learning/capstone/code/go.mod`** (committed fixture and module declaration):

```text
module golangindepth/capstone-dues

go 1.27
```

**`learning/capstone/code/input.txt`** (committed fixture and module declaration):

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

**`learning/capstone/code/ledger.go`**:

```go
// Package main implements gali, the dues-ledger reporter.
// => gali reads member dues, skips malformed lines honestly, and prints a report
// => pure logic in ledger.go, thin wiring in main.go: the top-down shape
package main

import (
	"fmt"     // => Errorf builds the typed parse failures below
	"sort"    // => sorts member names: report order never depends on map order
	"strconv" // => Atoi converts amounts with overflow checked, never wrapped
	"strings" // => SplitN and TrimSpace: the line grammar, stdlib only
)

// Due is one settled obligation: who paid and how much, validated.
// => plain data: parsing fills it, reporting reads it, nothing else touches it
type Due struct { // => the domain, stated once where every reader starts
	Member string // => who paid: non-empty after validation, always
	Amount int    // => how much: non-negative after validation, always
}

// parseLine converts one "member:amount" line into a Due or an honest error.
// => SplitN on ":" with 2 parts: exactly one colon separates the two fields
// => TrimSpace tolerates "sari : 50": humans pad, the parser forgives spaces
func parseLine(line string) (Due, error) { // => (Due, error): the honest pair
	// => two fields exactly: one colon means member AND amount are present
	parts := strings.SplitN(line, ":", 2) // => ["sari", "50"]: names and numbers
	// => wrong field count: no colon at all, or nothing but a colon
	if len(parts) != 2 { // => SplitN always returns >= 1: 1 means "no colon"
		return Due{}, fmt.Errorf("bad line %q: want member:amount", line)
	}
	// => trim both sides: " sari " becomes "sari" before any validation runs
	member := strings.TrimSpace(parts[0])     // => who: spaces forgiven, emptiness not
	amountText := strings.TrimSpace(parts[1]) // => how much: text becomes number next
	// => empty member: ":40" names nobody, so the line cannot settle anywhere
	if member == "" { // => guard: anonymous money has no ledger to enter
		return Due{}, fmt.Errorf("bad line %q: empty member", line)
	}
	// => Atoi with base 10: "xyz" fails here instead of becoming a silent zero
	amount, err := strconv.Atoi(amountText) // => text to int, errors on garbage
	// => non-numeric amount: the line names a member but no valid money
	if err != nil { // => "xyz" lands here: wrapped with the line for context
		return Due{}, fmt.Errorf("bad line %q: %w", line, err) // => %w links cause
	}
	// => negative amount: dues only grow ledgers, so negatives are refused
	if amount < 0 { // => guard: the domain admits no negative payments
		return Due{}, fmt.Errorf("bad line %q: negative amount", line)
	}
	return Due{Member: member, Amount: amount}, nil // => valid: both fields proven
}

// summarize folds dues into per-member totals plus the grand total, sorted.
// => map accumulates: member to total, sharing the reference semantics of maps
// => sorted names out: map RANGE order never leaks into the report, ever
func summarize(dues []Due) (names []string, totals map[string]int, grand int) {
	// => totals map: the accumulator, one bucket per member seen
	totals = map[string]int{} // => empty: first payment creates each bucket
	// => single pass: accumulate per member AND the grand total together
	for _, d := range dues { // => input order: accumulation ignores order anyway
		totals[d.Member] += d.Amount // => missing key starts at 0: the map rule
		grand += d.Amount            // => grand total: every valid due counts
	}
	// => names sorted: deterministic report order on every run, every machine
	for name := range totals { // => range collects keys: order unspecified here
		names = append(names, name) // => collect first: sorting happens once below
	}
	sort.Strings(names)         // => alphabetical: budi, citra, sari: fixed forever
	return names, totals, grand // => all three answers: who, how much each, how much all
}
```

**`learning/capstone/code/ledger_test.go`**:

```go
// Tests for the capstone ledger: parsing table plus the summary contract.
// => table test for parseLine: five line shapes, one shared assertion loop
// => summary test: fixed dues fold into exact per-member and grand totals
package main

import "testing" // => the assertion runner: Table plus one summary test

// TestParseLine pins the line grammar: valid lines parse, broken lines refuse.
// => rows: name for the subtest, input line, want member, want amount, want error
func TestParseLine(t *testing.T) { // => one function, five rows, one assertion
	// => anonymous struct: exact fields for input, wants, and the error flag
	cases := []struct { // => data holds coverage: valid, malformed, edge shapes
		name    string // => subtest label: failures name the row, not a line
		line    string // => input: the raw ledger line under test
		member  string // => want: member when valid, ignored when refused
		amount  int    // => want: amount when valid, ignored when refused
		wantErr bool   // => want: true for every refusal row below
	}{ // => valid padded, missing colon, empty member, garbage amount, negative
		{"valid padded", " sari : 50 ", "sari", 50, false}, // => spaces forgiven
		{"missing colon", "oops-no-colon", "", 0, true},    // => no colon: refuse
		{"empty member", ":40", "", 0, true},               // => nobody: refuse
		{"garbage amount", "sari:xyz", "", 0, true},        // => not a number
		{"negative amount", "sari:-5", "", 0, true},        // => dues grow only
	}
	// => one loop, full assertion: error flag first, then fields when valid
	for _, c := range cases { // => c copies the row: safe to capture below
		t.Run(c.name, func(t *testing.T) { // => named: failures name the shape
			// => call once, check the error flag before touching any field
			got, err := parseLine(c.line) // => the single call under assertion
			// => refusal rows must error; valid rows must parse exactly
			if (err != nil) != c.wantErr { // => error presence is the first fact
				t.Fatalf("parseLine(%q) err = %v, wantErr %v", c.line, err, c.wantErr)
			}
			// => valid rows only: member AND amount must match exactly
			if err == nil && (got.Member != c.member || got.Amount != c.amount) {
				t.Errorf("parseLine(%q) = %+v, want {%s %d}", c.line, got, c.member, c.amount)
			}
		})
	}
}

// TestSummarizeFoldsTotals proves accumulation over a fixed three-due ledger.
// => fixed dues: sari twice, budi once: accumulation (not overwrite) asserted
func TestSummarizeFoldsTotals(t *testing.T) { // => the folding contract, pinned
	// => fixed input: two members, three dues, one member paid twice
	dues := []Due{{"sari", 50}, {"budi", 75}, {"sari", 10}} // => sari totals 60
	// => single call: names sorted, per-member totals, grand total together
	names, totals, grand := summarize(dues) // => the only logic call under test
	// => sorted names: alphabetical contract, map order never leaks out
	if len(names) != 2 || names[0] != "budi" || names[1] != "sari" { // => exact order
		t.Errorf("names = %v, want [budi sari]", names) // => names the wrong order
	}
	// => per-member totals: accumulation proven, overwrite disproven by sari
	if totals["sari"] != 60 || totals["budi"] != 75 { // => 50+10, and 75
		t.Errorf("totals = %v, want map[budi:75 sari:60]", totals) // => names both
	}
	// => grand total: 50+75+10: the sum of every valid due, nothing skipped
	if grand != 135 { // => exact: ints, no float anywhere near money
		t.Errorf("grand = %d, want 135", grand) // => names the wrong total
	}
}
```

**`learning/capstone/code/main.go`**:

```go
// Command gali settles the dues ledger in input.txt and prints a report.
// => thin main: read lines, parse with ledger.go, summarize, print the report
// => malformed lines SKIP with a count: honesty over silent drops, always
package main

import (
	"fmt" // => prints the per-member report plus the skipped-line honesty count
	"os"  // => ReadFile loads input.txt; exit codes stay zero: errors print
)

// report builds the printable settlement lines from parsed dues and skips.
// => pure function: same dues in, same lines out: testable without files
// => skipped count rides along: the report admits what it could not settle
func report(names []string, totals map[string]int, grand int, skipped int) []string {
	// => one line per member in sorted order, then the two summary lines
	lines := []string{}          // => empty: appends grow it to members plus two
	for _, name := range names { // => sorted input: report order deterministic
		// => "member: total": the per-member settlement line, exact cents
		lines = append(lines, fmt.Sprintf("%s: %d", name, totals[name]))
	}
	// => grand total: every valid due counted exactly once, stated plainly
	lines = append(lines, fmt.Sprintf("grand total: %d", grand))
	// => honesty line: malformed lines counted, never silently swallowed
	lines = append(lines, fmt.Sprintf("skipped lines: %d", skipped))
	return lines // => the golden transcript: compared byte-for-byte by the harness
}

func main() {
	// => input.txt sits beside this file: the harness runs with cwd here
	data, err := os.ReadFile("input.txt") // => whole file: small, fixed, committed
	// => unreadable input is fatal to the report: say so, exit non-zero never
	if err != nil { // => missing input.txt: environmental, reported plainly
		fmt.Println("input:", err) // => stdout (not stderr): harness compares stdout
		return                     // => nothing valid to settle or print below
	}
	// => parse every line: valid dues accumulate, broken lines count as skipped
	dues := []Due{}                                 // => valid dues only: broken lines never enter this slice
	skipped := 0                                    // => honesty counter: every refusal increments, none vanish
	for _, line := range splitLines(string(data)) { // => one pass, all lines
		// => blank lines skip silently: trailing newline is not a broken due
		if line == "" { // => the file's final newline yields one empty string
			continue // => not malformed: just the end of the file, ignore it
		}
		// => parseLine decides: valid dues settle, broken lines count skipped
		due, err := parseLine(line) // => the grammar gate from ledger.go
		if err != nil {             // => malformed: counted, never settled, never hidden
			skipped++ // => honesty: the report will admit this exact count
			continue  // => next line: one broken line never stops the ledger
		}
		dues = append(dues, due) // => valid: enters the settlement below
	}
	// => summarize folds valid dues: sorted names, per-member totals, grand
	names, totals, grand := summarize(dues) // => pure logic: tested in ledger_test
	// => print the golden transcript: one line per report entry, in order
	for _, line := range report(names, totals, grand, skipped) { // => fixed lines
		fmt.Println(line) // => the transcript: byte-compared, deterministic
	}
}

// splitLines splits text on newlines without importing strings in main.
// => tiny local helper: keeps main.go's imports to fmt and os only
func splitLines(s string) []string { // => manual split: no dependency, no surprise
	// => accumulate segments between newlines: the last segment may be empty
	var out []string              // => nil grows by append: trailing newline yields "" last
	start := 0                    // => segment start: advances past each newline found
	for i := 0; i < len(s); i++ { // => byte scan: input is plain ASCII here
		if s[i] == '\n' { // => newline: cut the segment, advance past it
			out = append(out, s[start:i]) // => segment without the newline
			start = i + 1                 // => next segment starts after it
		}
	}
	// => tail after the last newline: "" when the file ends with newline
	return append(out, s[start:]) // => final segment: possibly empty, handled above
}
```

## Golden transcript

Two runs produce the transcript: the test suite first, then the binary. The test output proves the line grammar and the folding contract; the main output is the settlement report itself. Both are byte-compared on every harness run.

**Output** (`learning/capstone/code/expected/test/test.stdout.txt`):

```text
=== RUN   TestParseLine
=== RUN   TestParseLine/valid_padded
=== RUN   TestParseLine/missing_colon
=== RUN   TestParseLine/empty_member
=== RUN   TestParseLine/garbage_amount
=== RUN   TestParseLine/negative_amount
--- PASS: TestParseLine
    --- PASS: TestParseLine/valid_padded
    --- PASS: TestParseLine/missing_colon
    --- PASS: TestParseLine/empty_member
    --- PASS: TestParseLine/garbage_amount
    --- PASS: TestParseLine/negative_amount
=== RUN   TestSummarizeFoldsTotals
--- PASS: TestSummarizeFoldsTotals
PASS
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
budi: 100
citra: 25
sari: 60
grand total: 185
skipped lines: 3
```

## Testing

The test run executes TestParseLine over five line shapes (padded valid, missing colon, empty member, garbage amount, negative amount) and TestSummarizeFoldsTotals over a fixed three-due ledger that proves accumulation instead of overwrite. The subtests name their rows, so a failure points at the line shape, not a line number. Run the test command from the capstone directory during development; the harness runs it for you.

## Extensions

Three natural extensions stay inside the same architecture. First, strict mode: refuse the whole run when any line is malformed, returning a non-zero exit with the offending line numbers instead of a skip count. Second, multiple input files: range over arguments, settle each file separately, and print a combined grand total with per-file subtotals. Third, machine output: add a `-json` flag that marshals the same report struct with encoding/json, reusing summarize unchanged. Each extension adds a table row or a flag branch, and the existing transcript keeps proving nothing else moved.
