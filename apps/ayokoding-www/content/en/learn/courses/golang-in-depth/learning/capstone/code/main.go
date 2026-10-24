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
