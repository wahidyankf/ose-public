// Example 74: Read a Test by Its Table.
//
// A table test reads data-first: rows name behaviors, one loop checks them.
// This program replays Example 35's grade table through a tiny reporter.
package main

import "fmt" // => prints one PASS line per row, then the summary count

// grade repeats Example 35's logic: the function this table pins down.
// => duplicated deliberately: the example is about READING tables, standalone
func grade(score int) string { // => same bands: A, B, C, default F
	switch { // => tagless: first true band wins, order is the logic
	case score >= 90: // => top band: checked before anything below
		return "A" // => one band, one letter
	case score >= 75: // => second band: reached only below 90
		return "B" // => boundary-inclusive: 75 earns B
	case score >= 60: // => passing floor: last band before default
		return "C" // => 60 earns C: inclusive, like the original
	default: // => everything below 60: the documented fallback
		return "F" // => F: nothing claimed it, failure by elimination
	}
}

func main() {
	// => the table: name, input, want: the three columns every table needs
	cases := []struct { // => anonymous struct: columns as fields, rows as data
		name  string // => row label: failures would name THIS, not a line
		score int    // => input column: fed to grade, one row at a time
		want  string // => want column: the contract, stated per row
	}{ // => five rows: same coverage as the real test in Example 35
		{"top", 95, "A"},       // => clears 90: A, never B
		{"upper mid", 85, "B"}, // => clears 75 only: B exactly
		{"lower mid", 70, "C"}, // => clears 60 only: C exactly
		{"failing", 55, "F"},   // => clears nothing: the default owns it
		{"zero", 0, "F"},       // => degenerate: F without any band logic
	}
	// => the loop: call, compare, count: the assertion every table shares
	passed := 0               // => pass counter: the summary line's numerator below
	for _, c := range cases { // => one pass per row: the table drives, code follows
		// => compare got versus want: the ONLY assertion, identical each row
		if got := grade(c.score); got == c.want { // => match: count it
			passed++                     // => one more row holds: increment, keep going
			fmt.Println("PASS:", c.name) // => Output: PASS: <row name>
		} else {
			fmt.Println("FAIL:", c.name, got) // => unreachable: table is correct
		}
	}
	// => summary: passed of total: the line real runners print as "ok"
	fmt.Println("passed:", passed, "of", len(cases)) // => Output: passed: 5 of 5
}
