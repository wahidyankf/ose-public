// Table test for Grade: five rows, one shared assertion loop.
// => table shape: name the case, feed input, state the want, loop once
// => adding a case appends a row: the test function never grows new branches
package main

import "testing" // => *testing.T carries failures back to the go test runner

// TestGrade runs every band boundary through the same assertion below.
// => one function for the whole table: the loop, not copies, scales cases
func TestGrade(t *testing.T) { // => t reports which ROW failed, by name
	// => anonymous struct: exact fields for input, want, and readable case name
	cases := []struct { // => the table: data, not code, holds the coverage
		name  string // => subtest label: failure output names the row
		score int    // => input: the score Grade must classify
		want  string // => want: the letter the band promises
	}{ // => five rows: top, two middles, floor, and the failing default
		{"top band", 95, "A"},     // => 95 clears 90: A without touching B
		{"upper middle", 85, "B"}, // => 85 clears 75 but not 90: B exactly
		{"lower middle", 70, "C"}, // => 70 clears 60 but not 75: C exactly
		{"failing", 55, "F"},      // => 55 clears nothing: the default owns it
		{"zero", 0, "F"},          // => 0 clears nothing either: F, not panic
	}
	// => range the table: each row becomes a named subtest below
	for _, c := range cases { // => c copies one row per pass: safe to capture
		// => Run names the subtest: failures print "TestGrade/upper middle"
		t.Run(c.name, func(t *testing.T) { // => subtest per row, isolated verdict
			// => the ONLY assertion: got versus want, same for every row
			if got := Grade(c.score); got != c.want { // => call, compare, report
				// => Errorf keeps going: one failing row never hides the rest
				t.Errorf("Grade(%d) = %q, want %q", c.score, got, c.want)
			}
		})
	}
}
