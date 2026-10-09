package main

import "testing"

func TestDoubleCases(t *testing.T) { // => One test function checks two rows.
	for _, test := range []struct{ in, want int }{{2, 4}, {3, 6}} { // => 2→4 and 3→6.
		if got := double(test.in); got != test.want { // => Compare output with this row's want.
			t.Fatalf("double(%d) = %d", test.in, got) // => Identify the failing input and actual value.
		}
	}
}
