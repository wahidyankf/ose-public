---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to Go In Depth: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): Why does the guard clause come before the happy path in Example 1?

<details><summary>Answer</summary>

Failures handled first leave the success path at the margin with no nesting, so readers meet the normal flow without holding failure conditions in mind. Early returns turn preconditions into exits instead of indentation.

</details>

### Q2 (co-01): When do you reach for a tagless switch instead of an if-else ladder?

<details><summary>Answer</summary>

When one value faces several ordered range checks, as in Example 3: the tagless switch lists truth cases top-down with automatic no-fallthrough, while ladders nest and repeat the variable. Order the cases narrowest first.

</details>

### Q3 (co-01): What does defer's LIFO order guarantee for cleanup pairs?

<details><summary>Answer</summary>

The last-registered cleanup runs first, mirroring acquisition order, so the innermost resource releases before its outer container. Example 8 traces three defers; Example 77 extends the order across call levels inside-out.

</details>

### Q4 (co-02): Why is (value, error) preferable to exceptions for recoverable failure?

<details><summary>Answer</summary>

The return keeps every failure path explicit and local: the caller checks exactly where the call happened instead of catching from three layers away. Example 9 shows both branches; ignoring the error is a visible choice, not luck.

</details>

### Q5 (co-02): When do you wrap with %w, and when is it wrong to wrap?

<details><summary>Answer</summary>

Wrap once per layer boundary to add context while keeping the cause reachable, as in Example 11. Wrapping every line buries the signal in repetition; wrap where the failure crosses a layer, never inside tight loops over the same error.

</details>

### Q6 (co-02): How do errors.Is and errors.As divide the matching work?

<details><summary>Answer</summary>

Is answers identity (is this the sentinel anywhere in the chain, Example 12); As answers type-and-data (give me the \*FieldError link so I can read its fields, Example 13). Match behavior with the sentinel, react to data with the typed error.

</details>

### Q7 (co-02): Why does errors.Join skip nils, and what does that buy the caller?

<details><summary>Answer</summary>

Nils contribute no failure, so Join collects only real errors from independent checks without pre-filtering. Example 15 runs name and age validation together; the joined error still matches each part with Is.

</details>

### Q8 (co-03): What single rule prevents stale-slice bugs after append?

<details><summary>Answer</summary>

Always keep append's result: append may copy to a new array, and the old slice then points at discarded storage. Example 4 shows len and cap moving; reslicing shares while append-return-keeping stays current.

</details>

### Q9 (co-03): How does comma-ok separate a stored zero from a missing key?

<details><summary>Answer</summary>

The second return reports presence, so branch on the flag instead of the value: oat reads 0 with ok true (present but empty) while tea reads 0 with ok false (absent). Example 5 proves zero is legitimate data.

</details>

### Q10 (co-03): Why does range hand you a copy, and how do you mutate through it?

<details><summary>Answer</summary>

Copies keep loop bodies safe from accidental aliasing, but writing the copy variable is a silent no-op. Mutate through the index (scores[i]) as in Example 6, which names the stored element instead of a throwaway.

</details>

### Q11 (co-04): When does strings.Builder beat += in a loop?

<details><summary>Answer</summary>

When the loop runs an unknown or large number of iterations: += copies the growing string every pass (quadratic), while Builder amortizes like append. Example 18 assembles a CSV line; one small concatenation still reads better with +.

</details>

### Q12 (co-04): Why does strconv take an explicit bit size, and what breaks without it?

<details><summary>Answer</summary>

The width turns range validation into a parse error instead of silent wraparound: ParseUint(text, 10, 16) rejects 99999 as a port. Example 19 wraps the failure with %w so callers can still tell syntax from range with As.

</details>

### Q13 (co-04): How do struct tags act as the wire contract for JSON?

<details><summary>Answer</summary>

Tags map Go fields to JSON keys beside the fields they govern, so the shape is reviewed wherever the struct is reviewed. Example 22 uses omitempty to drop unset stock; decoding ignores unknown keys unless strictness is requested.

</details>

### Q14 (co-04): Why does encoding/csv beat strings.Split for real CSV?

<details><summary>Answer</summary>

Split cuts every comma including quoted ones, while csv.Reader treats quotes as syntax. Kata 03 proves it on a city containing a comma; hand-rolled splitting is correct only for data that can never quote.

</details>

### Q15 (co-05): What is the reference date, and why does one layout serve both directions?

<details><summary>Answer</summary>

Mon Jan 2 15:04:05 MST 2006 (month 1, day 2, hour 3, minute 4) is the layout alphabet: Format and Parse share it, so learning the reference teaches rendering and parsing together. Example 24 parses an invoice date and renders it for a receipt.

</details>

### Q16 (co-05): Why keep deadline math in time.Duration until the final report?

<details><summary>Answer</summary>

Durations are int64 nanoseconds, so comparisons stay exact without float rounding; converting to Hours happens once for display. Example 25 budgets a delivery window and gates dispatch on a plain <= between Durations.

</details>

### Q17 (co-06): What makes a directory a package, and what does internal/ add?

<details><summary>Answer</summary>

The package clause names it: files sharing one clause in one directory form the package, split by responsibility. internal/ restricts importers to the parent module, giving compiler-enforced privacy as in Example 29.

</details>

### Q18 (co-07): What does a require-free go.mod promise, and how is it verified?

<details><summary>Answer</summary>

No supply chain to audit, break, or update: the standard library suffices. go list -m all names only the module itself (Example 31); replace directives stay local so the build reproduces for everyone (Example 32).

</details>

### Q19 (co-08): What earns a test the right to be trusted?

<details><summary>Answer</summary>

Failing first: red on the old code, green on the fix, so the test proves it guards its case. Example 36 rehearses this; tables (Example 35), subtests (37), helpers with t.Helper (38), and doc examples (39) scale the habit.

</details>

### Q20 (co-08): When do seeds run, and when does fuzzing explore?

<details><summary>Answer</summary>

Seeds run as ordinary cases on every plain go test, pinning regressions for free; exploration needs the explicit -fuzz flag with a time budget. Example 41 asserts the double-reversal property over three seeds including multi-byte text.

</details>

### Q21 (co-09): How do you keep concurrent output deterministic?

<details><summary>Answer</summary>

Collect all answers, then sort before printing: scheduling decides arrival order, presentation decides output order. Examples 54, 57, and 60 buffer for every worker, Wait for the crew, close after Wait, and sort at the edge.

</details>

### Q22 (co-09): Who closes the channel, and why does it matter that it is the sender?

<details><summary>Answer</summary>

The sender closes: only it knows when no more values come, so receivers range to termination without counting. Closing from the receiver side panics or truncates; Example 55 makes close the sender's final statement.

</details>

### Q23 (co-10): What decides a type parameter's constraint, and how tight should it be?

<details><summary>Answer</summary>

The operations the body uses: Min needs <, so int | float64 or cmp.Ordered. Example 45 duplicates removed; Example 46 clamps ints, floats, and strings with one Ordered bound. Tight constraints promise more to callers.

</details>

### Q24 (co-11): When do you clone a slice, and what does keeping an alias cost?

<details><summary>Answer</summary>

Clone at ownership boundaries: a kept subslice pins the whole backing array and mutates under you. Example 50 breaks the alias before storing; maps share the same reference semantics (Example 53), so copy at trust boundaries too.

</details>

## Applied problems

Eight applied problems. Each names a real situation and the course habit that solves it; work them with an editor open and check your answer against the named example before moving on.

### Problem 1: Rewrite the translated loop

Port a Python-style while-counter into the counted for form from Example 2, then into the range form from Example 6. Name which version a Go reader parses fastest and why the counter variable's scope matters in each.

### Problem 2: Choose the error shape

Three failures: missing config file, invalid port text, expired license date. Decide for each whether it is a sentinel (Example 10), a wrapped chain (Example 11), or a typed struct (Example 13), and write the one-line justification the code reviewer will read.

### Problem 3: Replace the hand-rolled helper

Find strings.Split used for CSV, += in a loop building a report, and == comparing version triples in one program. Replace each with encoding/csv, strings.Builder, and cmp.Compare per Examples 18, 51, and kata 03, then show the outputs are identical.

### Problem 4: Flatten the admission pyramid

Take a four-level nested validator (age, member, dues, region) and rewrite it with guard clauses per Example 68. List every input that changes verdict and prove the list is empty.

### Problem 5: Bound the fan-out

A program launches one goroutine per input line with no limit. Convert it to the three-worker pool from Example 60, buffer both channels for the job count, and explain where the old version would exhaust memory first.

### Problem 6: Pin the untested function

Pick the least-tested pure function in your own code and write the table test from Example 35 for it: five rows including zero, negative, and boundary inputs. Run it red-first by asserting a wrong want once, then fix the want.

### Problem 7: Audit the dropped errors

Grep your code for \_ = and blank-identifier error drops. For each, either check it or attach the rationale comment per Example 65. Count how many were accidents versus reviewed decisions.

### Problem 8: Read a stranger's handler

Open any net/http handler you did not write and answer without running it: what does the signature promise, where is the fallback, what does the recorder see? Check your answers with httptest like Example 71.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the panic-to-error and table-test katas first, because error shapes and test tables underlie everything; the CSV, flatten, wrap, and counter katas next, because they train the four reflexes daily Go demands; the generics and tiebreak katas after, because they isolate one design judgement each.

### Kata 01: Convert Panic to Error

(Concepts: co-02.)

The starter validates with panic; rewrite it to return errors like Example 16 teaches at the boundary. The solution keeps both paths honest.

**Before** (`drilling/code/kata-01-convert-panic-to-error/before/starter.go`):

```go
// Starter: validation by panic. The bug: user input triggers a crash path.
// => panics on empty input: callers cannot recover without a boundary
// => rewrite: return (string, error) instead, following Example 16's rule
package main

import "fmt" // => prints the "validated" name: panics first on empty input

// mustName crashes on empty names: the panic-as-validation anti-pattern.
// => BUG: user input reaches panic: this is a crash path, not a contract
func mustName(name string) string { // => no error return: panic is the failure
	// => empty input panics: the exact shape Example 16 forbids in libraries
	if name == "" { // => user-controlled input: panic is never the answer
		panic("name is empty") // => BUG: crashes the caller without recourse
	}
	return "halo, " + name // => valid input: the only path that survives
}

func main() {
	// => valid input works: the bug hides until the empty string arrives
	fmt.Println(mustName("Sari")) // => prints, then the next call explodes
	fmt.Println(mustName(""))     // => BUG: panic, crash, no error to check
}
```

**After** (`drilling/code/kata-01-convert-panic-to-error/after/solution.go`):

```go
// Solution: validation by error return. Panic is gone from the path.
// => (string, error): user input failures travel as values, checkable locally
// => empty input returns an error: callers decide, exactly like Example 9
package main

import (
	"errors" // => the empty-name failure, built once and returned
	"fmt"    // => prints the greeting or the checked failure, never crashes
)

// greetName validates and greets: empty names return an error, never panic.
// => error return: the caller checks at the site, no boundary needed
func greetName(name string) (string, error) { // => (value, error): the contract
	// => guard clause first: failure returns before any greeting builds
	if name == "" { // => user input: refused as data, not as a crash
		return "", errors.New("name is empty") // => value plus failure, honest
	}
	return "halo, " + name, nil // => valid: greeting plus nil, success shape
}

func main() {
	// => valid input: greeting prints, error stays nil and unchecked-branch skips
	if g, err := greetName("Sari"); err != nil { // => nil skips this branch
		fmt.Println("unexpected:", err) // => unreachable: Sari is valid
	} else {
		fmt.Println(g) // => Output: halo, Sari
	}
	// => empty input: error returns, caller prints it, program survives
	if g, err := greetName(""); err != nil { // => non-nil: the refused path
		fmt.Println("error:", err) // => Output: error: name is empty
	} else {
		fmt.Println(g) // => unreachable: empty never greets
	}
}
```

**Output** (`drilling/code/kata-01-convert-panic-to-error/expected/main.stdout.txt`):

```text
halo, Sari
error: name is empty
```

### Kata 02: Write the First Table Test

(Concepts: co-08.)

The starter ships an untested Double; add the table test that pins it, following Example 35. The solution's test file is the deliverable.

**Before** (`drilling/code/kata-02-write-first-table-test/before/starter.go`):

```go
// Starter: an untested Double. The gap: no test pins its behavior.
// => Double works but nothing proves it: add calc_test.go in after/
// => follow Example 35: table rows for zero, positive, and negative inputs
package main

// Double returns twice its input: correct today, unguarded against tomorrow.
// => the deliverable: a table test pinning 0, positive, and negative cases
func Double(n int) int { // => pure: trivially testable, currently untested
	return n * 2 // => the logic the missing test must lock in place
}
```

**After** (`drilling/code/kata-02-write-first-table-test/after/calc.go`):

```go
// Double returns twice its input: the function the new test pins down.
// => pure function: same input always gives the same double, no state anywhere
// => table-tested in calc_test.go: zero, positive, and negative rows below
package after

// Double returns twice its input for any integer, negative included.
// => exported: the test file (same package) calls it directly by name
func Double(n int) int { // => int in, int out: exact, no floats near math
	return n * 2 // => the logic the table test locks in place, line by line
}
```

**After** (`drilling/code/kata-02-write-first-table-test/after/calc_test.go`):

```go
// Table test for Double: the kata deliverable, pinning three inputs.
// => table shape from Example 35: name, input, want, one shared assertion
// => zero, positive, negative: the three faces of doubling, each named
package after

import "testing" // => the runner: subtests name each row on failure

// TestDouble pins doubling across zero, positive, and negative inputs.
// => one function: adding a fourth case appends a row, never new code
func TestDouble(t *testing.T) { // => the table: data holds the coverage
	// => anonymous struct: name for the subtest, input, and want per row
	cases := []struct { // => three rows: the minimum honest coverage
		name string // => subtest label: failures name the row, not a line
		in   int    // => input: the integer Double must double
		want int    // => want: exactly twice the input, no approximation
	}{ // => zero, positive, negative: doubling's full personality in three rows
		{"zero stays zero", 0, 0},    // => 0 doubled: the degenerate promise
		{"positive doubles", 21, 42}, // => 21 becomes 42: the common case
		{"negative doubles", -3, -6}, // => sign preserved: negatives count too
	}
	// => one loop, one assertion: got versus want, identical for every row
	for _, c := range cases { // => c copies the row: safe to capture below
		t.Run(c.name, func(t *testing.T) { // => named: failures name the input
			// => the ONLY check: Double(in) must equal want, exactly
			if got := Double(c.in); got != c.want { // => call, compare, report
				t.Errorf("Double(%d) = %d, want %d", c.in, got, c.want) // => names all
			}
		})
	}
}
```

**Output** (`drilling/code/kata-02-write-first-table-test/expected/main.stdout.txt`):

```text
=== RUN   TestDouble
=== RUN   TestDouble/zero_stays_zero
=== RUN   TestDouble/positive_doubles
=== RUN   TestDouble/negative_doubles
--- PASS: TestDouble
    --- PASS: TestDouble/zero_stays_zero
    --- PASS: TestDouble/positive_doubles
    --- PASS: TestDouble/negative_doubles
PASS
```

### Kata 03: Replace the Hand-Rolled CSV Split

(Concepts: co-04.)

The starter splits CSV with strings.Split, which breaks on quoted commas. Rewrite with encoding/csv like Example 22 teaches for stdlib-first parsing.

**Before** (`drilling/code/kata-03-replace-hand-rolled-csv/before/starter.go`):

```go
// Starter: hand-rolled CSV split. The bug: quoted commas split rows.
// => strings.Split on commas: breaks the moment a field holds "a,b" quoted
// => rewrite: encoding/csv handles quotes, following the stdlib-first rule
package main

import (
	"fmt"     // => prints the mis-split fields: four instead of three
	"strings" // => Split: the naive tool this kata replaces with encoding/csv
)

func main() {
	// => quoted comma inside the second field: legal CSV, fatal for Split
	line := `sari,"jakarta, indonesia",41` // => three fields, one holds a comma
	// => naive split: every comma cuts, including the quoted one inside
	fields := strings.Split(line, ",") // => BUG: four pieces, quotes included
	// => four fields print: the middle city broke in two, quotes and all
	fmt.Println(len(fields), fields) // => wrong: 4 pieces, quotes leak into data
}
```

**After** (`drilling/code/kata-03-replace-hand-rolled-csv/after/solution.go`):

```go
// Solution: encoding/csv parses quotes correctly, stdlib-first.
// => csv.Reader honors quoted commas: the exact case the starter mangled
// => three fields out: city stays whole, quotes consumed as syntax, not data
package main

import (
	"encoding/csv" // => Reader: the stdlib CSV parser, quotes handled
	"fmt"          // => prints the three correct fields plus their count
	"strings"      // => NewReader: feeds the fixed line to the CSV parser
)

func main() {
	// => same tricky line: quoted comma inside the city field, unchanged
	line := `sari,"jakarta, indonesia",41` // => three fields: the honest count
	// => csv.Reader over the line: quotes become syntax, not field content
	r := csv.NewReader(strings.NewReader(line)) // => in-memory: no file needed
	// => Read returns one record: all fields, quotes resolved, commas kept
	fields, err := r.Read() // => three fields: the parser earns its keep here
	// => fixed input parses cleanly: errors mean malformed CSV, never here
	if err != nil { // => unreachable: the line is valid CSV by construction
		fmt.Println("unexpected:", err) // => kept: real inputs check this
		return                          // => nothing valid to print on failure
	}
	// => city whole, quotes gone: the parser consumed syntax, kept data
	fmt.Println(len(fields), fields) // => Output: 3 [sari jakarta, indonesia 41]
}
```

**Output** (`drilling/code/kata-03-replace-hand-rolled-csv/expected/main.stdout.txt`):

```text
3 [sari jakarta, indonesia 41]
```

### Kata 04: Flatten the Nested Checks

(Concepts: co-01, co-14.)

The starter nests three admission checks pyramid-style. Flatten with guard clauses like Example 68 and prove both shapes agree on four applicants.

**Before** (`drilling/code/kata-04-flatten-nested-checks/before/starter.go`):

```go
// Starter: pyramid admission checks. The smell: happy path deepest.
// => three nested ifs: readers count indentation to find which gate failed
// => rewrite: guard clauses at the margin, following Example 68's flat shape
package main

import "fmt" // => prints the pyramid verdict: correct, but rightward-drifting

// nested pyramids three gates: age, member, dues: deepest line is the prize.
// => correct logic, costly shape: every failure needs indent-counting to place
func nested(age int, member bool, dues bool) string { // => three conditions in
	if age >= 17 { // => level one: everything else nests inside the age gate
		if member { // => level two: membership, inside age
			if dues { // => level three: dues, inside both gates above
				return "admit" // => happy path: deepest line, hardest to find
			}
			return "pay dues" // => mid-level failure: indentation says where
		}
		return "join first" // => level-two failure: count braces to place it
	}
	return "too young" // => outermost failure reads last: backwards emphasis
}

func main() {
	// => one applicant through the pyramid: admitted, but found deep inside
	fmt.Println(nested(20, true, true)) // => admit: correct, rightward journey
}
```

**After** (`drilling/code/kata-04-flatten-nested-checks/after/solution.go`):

```go
// Solution: guard clauses at the margin. Same policy, flat shape.
// => inverted conditions return early: failures exit, the happy path stays last
// => four applicants prove equivalence: flat agrees with nested on every input
package main

import "fmt" // => prints four flat verdicts: admit, young, join, dues

// flat guards three gates at the margin: failure returns, success continues.
// => same policy as nested: inverted conditions, zero indentation growth
func flat(age int, member bool, dues bool) string { // => identical signature
	// => guard one: age fails, return at the margin, forget age below
	if age < 17 { // => inverted: failure first, margin kept
		return "too young" // => exit: remaining code assumes adult applicant
	}
	// => guard two: membership fails at the same margin, age already handled
	if !member { // => inverted: non-members leave, members continue flat
		return "join first" // => exit: remaining code assumes a member
	}
	// => guard three: dues fail last, still at the margin, never nested
	if !dues { // => inverted: debtors leave, the paid reach the happy path
		return "pay dues" // => exit: everything below assumes dues are paid
	}
	return "admit" // => happy path: flat, last, assuming all guards passed
}

func main() {
	// => four applicants: admit, too young, join first, pay dues: full surface
	fmt.Println(flat(20, true, true))  // => Output: admit
	fmt.Println(flat(16, true, true))  // => Output: too young
	fmt.Println(flat(20, false, true)) // => Output: join first
	fmt.Println(flat(20, true, false)) // => Output: pay dues
}
```

**Output** (`drilling/code/kata-04-flatten-nested-checks/expected/main.stdout.txt`):

```text
admit
too young
join first
pay dues
```

### Kata 05: Add Context with Wrap

(Concepts: co-02.)

The starter returns a bare sentinel with no context about which step failed. Wrap each layer with %w like Example 11, then prove errors.Is still matches.

**Before** (`drilling/code/kata-05-add-context-with-wrap/before/starter.go`):

```go
// Starter: bare sentinel, no context. The gap: WHICH step failed?
// => every layer returns ErrEmpty unchanged: the message never says where
// => rewrite: wrap with %w per layer, following Example 11's linked chain
package main

import (
	"errors" // => the bare sentinel, returned unchanged at every layer
	"fmt"    // => prints the context-free failure: informative nowhere
)

// ErrEmpty is the shared "nothing to save" sentinel from Example 12's shape.
var ErrEmpty = errors.New("nothing to save") // => one instance, compared by Is

// save refuses empty payloads with the bare sentinel: no layer context at all.
// => BUG-shape: callers learn WHAT failed but never WHICH step owned it
func save(payload string) error { // => returns ErrEmpty naked, context-free
	if payload == "" { // => guard: the only check this function owns
		return ErrEmpty // => naked: which caller, which step? unknowable
	}
	return nil // => non-empty: nothing to report, success shape
}

func main() {
	// => the failure prints bare: "nothing to save" with no step attached
	fmt.Println(save("")) // => context-free: WHICH save failed stays hidden
}
```

**After** (`drilling/code/kata-05-add-context-with-wrap/after/solution.go`):

```go
// Solution: each layer wraps with %w, context accumulates honestly.
// => chain reads request -> save -> sentinel: every frame named, Is intact
// => errors.Is proves the wrap preserved matching: the behavior contract holds
package main

import (
	"errors" // => Is walks the wrapped chain to find the sentinel below
	"fmt"    // => prints the full chain plus the Is verdict that proves it
)

// ErrEmpty is the shared sentinel: identity-compared through every wrap.
var ErrEmpty = errors.New("nothing to save") // => one instance, Is-matched

// save wraps the sentinel once: the repository layer names its context.
// => %w links: context added, identity preserved, Is still matches through
func save(payload string) error { // => single wrap: this layer's frame added
	if payload == "" { // => guard: the domain failure this function owns
		return fmt.Errorf("save record: %w", ErrEmpty) // => linked, not flat
	}
	return nil // => non-empty: nothing to report, success shape
}

func main() {
	// => caller wraps again: the service frame joins the chain honestly
	err := fmt.Errorf("handle request: %w", save("")) // => chain of three links
	// => full chain prints: every layer's context in order, no frame lost
	fmt.Println(err) // => Output: handle request: save record: nothing to save
	// => Is walks through both wraps: matching survives context, proven here
	fmt.Println("matches:", errors.Is(err, ErrEmpty)) // => Output: matches: true
}
```

**Output** (`drilling/code/kata-05-add-context-with-wrap/expected/main.stdout.txt`):

```text
handle request: save record: nothing to save
matches: true
```

### Kata 06: Guard the Shared Counter

(Concepts: co-09.)

The starter increments a shared counter from twenty goroutines with no guard; the solution adds the Mutex from Example 58 and the total lands exact.

**Before** (`drilling/code/kata-06-guard-shared-counter/before/starter.go`):

```go
// Starter: unguarded shared counter. The race: += is not atomic.
// => twenty goroutines share total with no mutex: increments interleave freely
// => rewrite: bundle a Mutex with the total, following Example 58's Counter
package main

import (
	"fmt"  // => prints the racy total: usually short of 2000, never reliably
	"sync" // => WaitGroup awaits the crew: the race itself is in the += below
)

// The race needs no special runner: main below races whenever it executes.
func main() {
	// => shared total: every goroutine writes this one variable, unguarded
	total := 0 // => the race site: += below is read-modify-write, not atomic
	// => twenty adders, one hundred each: exact answer would be 2000
	var wg sync.WaitGroup     // => awaits the crew: the count is exact, the sum not
	for i := 0; i < 20; i++ { // => twenty goroutines: the race needs company
		wg.Add(1)   // => count before launch: accounting correct, math racy
		go func() { // => each adder loops one hundred unguarded increments
			defer wg.Done()            // => release on return: the only disciplined line
			for j := 0; j < 100; j++ { // => one hundred read-modify-writes
				total++ // => RACE: lost updates when increments interleave
			}
		}()
	}
	// => Wait proves completion: the total below is final, just usually wrong
	wg.Wait()                         // => all done: the number is complete AND unreliable together
	fmt.Println("racy total:", total) // => often < 2000: the race made visible
}
```

**After** (`drilling/code/kata-06-guard-shared-counter/after/solution.go`):

```go
// Solution: Mutex-guarded counter. Twenty goroutines, exact total.
// => Counter bundles total with its mutex: the guard cannot be separated
// => twenty adders, one hundred each: 2000 on every schedule, proven below
package main

import (
	"fmt"  // => prints the exact guarded total: 2000, every single run
	"sync" // => Mutex guards, WaitGroup awaits: the Example 58 pairing
)

// Counter pairs the shared total with the mutex guarding it, inseparably.
// => struct bundles state and guard: unguarded access becomes a shape error
type Counter struct { // => guarded state: only Add and Value may touch total
	mu    sync.Mutex // => zero ready: unlocked, no constructor needed
	total int        // => guarded: between Lock and Unlock, never elsewhere
}

// Add grows the total under the lock: the critical section is one line.
// => pointer receiver: every caller shares the ONE mutex, never a copy
func (c *Counter) Add(n int) { // => the single sanctioned mutation path
	c.mu.Lock()   // => enter: exclusive access starts here
	c.total += n  // => critical section: one statement, nothing more
	c.mu.Unlock() // => leave: waiting adders proceed one by one
}

// Value reads the total under the lock: readers synchronize with writers.
func (c *Counter) Value() int { // => locked snapshot: never a torn read
	c.mu.Lock()         // => readers lock too: exclusion covers both sides
	defer c.mu.Unlock() // => deferred: the read below cannot leak the lock
	return c.total      // => copy out under lock: safe after unlock
}

func main() {
	// => one counter, twenty adders, one hundred each: exact total 2000
	var c Counter // => zero value: unlocked mutex, zero total, ready now
	// => WaitGroup awaits the crew: same accounting as the starter, honest math
	var wg sync.WaitGroup     // => counts twenty adders: twenty Dones expected
	for i := 0; i < 20; i++ { // => twenty goroutines: the race's old company
		wg.Add(1)   // => count before launch: accounting rule, unchanged
		go func() { // => each adder loops one hundred GUARDED increments
			defer wg.Done()            // => release on return: discipline kept from starter
			for j := 0; j < 100; j++ { // => one hundred serialized additions
				c.Add(1) // => guarded: serialized with the other nineteen
			}
		}()
	}
	// => Wait proves every adder finished: the total below is final AND exact
	wg.Wait()                                // => twenty Dones: nobody still holds the mutex
	fmt.Println("guarded total:", c.Value()) // => Output: guarded total: 2000
}
```

**Output** (`drilling/code/kata-06-guard-shared-counter/expected/main.stdout.txt`):

```text
guarded total: 2000
```

### Kata 07: Replace Two Mins with One Generic

(Concepts: co-10.)

The starter duplicates Min for ints and floats. Replace both with one generic function like Example 45 and prove both instantiations agree.

**Before** (`drilling/code/kata-07-generic-min-replaces-two/before/starter.go`):

```go
// Starter: two Mins, one idea. The duplication: logic copied per type.
// => MinInt and MinFloat differ only in their type names: pure duplication
// => rewrite: one generic Min[T int | float64], following Example 45's shape
package main

import "fmt" // => prints both minimums: correct, but from two cloned bodies

// MinInt returns the smaller of two ints: copy one of two identical logics.
// => int-only: floats need the twin below, same body, different signature
func MinInt(a, b int) int { // => first copy: the idea, bound to int
	if a < b { // => same comparison the float twin repeats verbatim
		return a // => smaller wins: logic identical to MinFloat below
	}
	return b // => otherwise b: duplicated line, duplicated review burden
}

// MinFloat returns the smaller of two floats: copy two of the same idea.
// => float-only: the twin the generic will absorb into one function
func MinFloat(a, b float64) float64 { // => second copy: the idea, bound to float64
	if a < b { // => verbatim repeat: the duplication this kata removes
		return a // => smaller wins: same sentence, second spelling
	}
	return b // => otherwise b: two copies to keep in sync, forever
}

func main() {
	// => both copies work: the complaint is maintenance, not behavior
	fmt.Println(MinInt(3, 7), MinFloat(2.5, 1.5)) // => 3 and 1.5: correct twice
}
```

**After** (`drilling/code/kata-07-generic-min-replaces-two/after/solution.go`):

```go
// Solution: one generic Min replaces both copies, instantiations prove it.
// => [T int | float64]: the type parameter absorbs the only difference
// => call sites infer T: no explicit arguments, reads like the originals
package main

import "fmt" // => prints both minimums from the ONE generic body

// Min returns the smaller of two ordered numerics of any single type.
// => one function: the compiler stamps an int copy and a float64 copy
func Min[T int | float64](a, b T) T { // => T bound to numerics: < always valid
	// => single comparison: written once, reviewed once, trusted twice
	if a < b { // => < valid for every T the constraint admits
		return a // => smaller wins: the only copy of this line left
	}
	return b // => otherwise b wins (or they tie: either fits)
}

func main() {
	// => T inferred int: the stamp that replaced MinInt, call-site silent
	fmt.Println(Min(3, 7)) // => Output: 3
	// => T inferred float64: the stamp that replaced MinFloat, same silence
	fmt.Println(Min(2.5, 1.5)) // => Output: 1.5
}
```

**Output** (`drilling/code/kata-07-generic-min-replaces-two/expected/main.stdout.txt`):

```text
3
1.5
```

### Kata 08: Stabilize Ranks with a Tiebreak

(Concepts: co-03.)

The starter sorts contributors by commits only, leaving ties in input order. Add the name tiebreak from Example 7 so equal commits rank deterministically.

**Before** (`drilling/code/kata-08-sort-tiebreak-stabilizes-ranks/before/starter.go`):

```go
// Starter: commits-only sort. The gap: ties keep input order, unstable.
// => less compares Commits alone: equal commits never establish an order
// => rewrite: add the name tiebreak, following Example 7's two-key predicate
package main

import (
	"fmt"  // => prints the tie-unstable ranking: citra before budi by luck
	"sort" // => Slice sorts in place with the single-key predicate below
)

// Dev pairs a handle with a commit count: the ranking input for both shapes.
type Dev struct { // => same type the solution reuses: data unchanged, order fixed
	Name    string // => tiebreak key, IGNORED by the starter predicate
	Commits int    // => primary key: the only key the starter compares
}

func main() {
	// => citra listed before budi with equal commits: input order decides ties
	team := []Dev{{"citra", 30}, {"sari", 41}, {"budi", 30}} // => tie: 30 and 30
	// => single-key less: commits only, ties left wherever input put them
	sort.Slice(team, func(i, j int) bool { // => one comparison, no tiebreak
		return team[i].Commits > team[j].Commits // => tie: returns false both ways
	})
	// => citra still precedes budi: input order survived, not a real ranking
	fmt.Println(team) // => order of the tie is luck: rerun with shuffled input
}
```

**After** (`drilling/code/kata-08-sort-tiebreak-stabilizes-ranks/after/solution.go`):

```go
// Solution: two-key less with the name tiebreak. Ties rank deterministically.
// => primary commits, tiebreak name: the full ordering in one predicate
// => budi precedes citra on 30: alphabetical, not input-order luck
package main

import (
	"fmt"  // => prints the tie-stable ranking: sari, budi, citra, always
	"sort" // => Slice with the two-key predicate: ties resolved, not kept
)

// Dev pairs a handle with a commit count: identical data, stable order now.
type Dev struct { // => same shape as the starter: only the predicate changed
	Name    string // => tiebreak key, USED by the solution predicate
	Commits int    // => primary key: higher commits still rank first
}

func main() {
	// => same tricky input: citra before budi, equal commits, tie to resolve
	team := []Dev{{"citra", 30}, {"sari", 41}, {"budi", 30}} // => tie: 30 and 30
	// => two-key less: commits first, name on ties: deterministic, input-proof
	sort.Slice(team, func(i, j int) bool { // => primary plus tiebreak, one place
		// => tie test guards the tiebreak: unequal commits never reach names
		if team[i].Commits != team[j].Commits { // => primary decides first
			return team[i].Commits > team[j].Commits // => descending commits
		}
		return team[i].Name < team[j].Name // => tiebreak: budi before citra
	})
	// => ranked: sari 41 first, then the 30-tie broken alphabetically, always
	fmt.Println(team) // => Output: [{sari 41} {budi 30} {citra 30}]
}
```

**Output** (`drilling/code/kata-08-sort-tiebreak-stabilizes-ranks/expected/main.stdout.txt`):

```text
[{sari 41} {budi 30} {citra 30}]
```

## Self-check checklist

Twenty-four self-check items, at least one per concept from co-01 to co-16. Read each aloud as a promise: if you hesitate on any item, return to its example before calling the course done.

- [ ] I can return early with guard clauses instead of nesting the happy path (co-01).
- [ ] I can pick the counted, conditional, or infinite for form deliberately (co-01).
- [ ] I can write tagless switches with narrowest-first case order (co-01).
- [ ] I can return errors as values and check them before using results (co-02).
- [ ] I can create one sentinel per well-known failure and compare with == (co-02).
- [ ] I can wrap with %w at layer boundaries and match with errors.Is (co-02).
- [ ] I can extract typed failure data with errors.As instead of parsing text (co-02).
- [ ] I can bundle independent validation failures with errors.Join (co-02).
- [ ] I can keep panic for programmer bugs and recover only at boundaries (co-02).
- [ ] I can check deferred close errors and join them into the return (co-02).
- [ ] I can keep append's result and read len and cap honestly (co-03).
- [ ] I can branch map lookups on the comma-ok flag, never the value (co-03).
- [ ] I can mutate slices through indexes, never through range copies (co-03).
- [ ] I can build repeated strings with strings.Builder (co-04).
- [ ] I can parse numbers with explicit bit sizes and wrapped errors (co-04).
- [ ] I can let struct tags own the JSON wire shape with omitempty where apt (co-04).
- [ ] I can format and parse times with the reference layout, fixed clocks in tests (co-05).
- [ ] I can do deadline math in Duration and convert to float only to report (co-05).
- [ ] I can split packages by responsibility and hide helpers behind internal/ (co-06).
- [ ] I can prefer the standard library before adding a require line (co-07).
- [ ] I can prove tests red-first and pin behavior with tables and subtests (co-08).
- [ ] I can buffer for every worker, Wait before closing, sort before printing (co-09).
- [ ] I can replace duplicated logic with constrained type parameters (co-10).
- [ ] I can clone slices at ownership boundaries and share maps deliberately (co-11).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design decision and the rejected alternative; answer from your own experience first, then compare with the model answer. The goal is judgement transfer, not memorization.

### E1: Why does Go return errors instead of throwing them, and what is lost in exchange?

<details><summary>Model answer</summary>

Returned errors keep every failure path local and visible, at the cost of the if-err verbosity other languages hide. Model answer: the verbosity IS the feature — each check names the failure where it happens — and helpers plus wrapping keep it from becoming noise; what is lost is non-local recovery, which Go deliberately confines to panic boundaries.

</details>

### E2: Why must the sender close the channel rather than the receiver, and when would you not close at all?

<details><summary>Model answer</summary>

Only the sender knows when values end; a receiver close panics on send or truncates siblings. Model answer: range-to-close needs exactly one closer with complete knowledge; pipelines that run forever (servers) never close, and multiple senders coordinate through Wait plus a single post-Wait close as in Example 57.

</details>

### E3: Why does the standard library win over a dependency for text, time, and sorting?

<details><summary>Model answer</summary>

Stdlib code ships with the toolchain: no versions to pin, no audits, no yanked releases. Model answer: the cost of a dependency is permanent (supply chain, drift, review) while the cost of stdlib is one import; reach outward only when the stdlib shape genuinely cannot express the need.

</details>

### E4: Why do small interfaces compose better than wide ones, and what breaks when an interface grows?

<details><summary>Model answer</summary>

One-method interfaces like io.Reader admit every decorator with a single method to implement; wide interfaces force implementors to stub methods they do not need. Model answer: io's power comes from callers (ReadAll, Copy) that accept anything narrow; growing an interface breaks every implementor at once, so keep them minimal and compose.

</details>

### E5: Why sort before printing instead of asserting on arrival order in concurrent programs?

<details><summary>Model answer</summary>

Arrival order is schedule-dependent, so asserting on it tests the scheduler rather than the program. Model answer: determinism belongs at the presentation edge — collect everything, sort, then print — which keeps the concurrency honest inside and the output stable outside.

</details>

### E6: Why is a failing-first test worth the extra red step, and when is it theater?

<details><summary>Model answer</summary>

Red proves the test can catch the bug it guards; without it the test may assert nothing. Model answer: it is worth it when the want is written before the fix runs; it is theater when the red is manufactured (asserting a typo) rather than observed against real broken behavior.

</details>
