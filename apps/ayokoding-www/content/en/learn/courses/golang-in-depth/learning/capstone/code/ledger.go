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
