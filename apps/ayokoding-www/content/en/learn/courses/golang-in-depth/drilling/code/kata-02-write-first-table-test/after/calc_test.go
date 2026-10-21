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
