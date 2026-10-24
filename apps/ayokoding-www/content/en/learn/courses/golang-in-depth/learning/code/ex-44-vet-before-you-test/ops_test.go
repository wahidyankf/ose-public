// Tests for Total: valid sums plus the negative-qty refusal.
// => vetted first by the run command: verb mismatches would fail before this
// => table shape: three invoices, one shared assertion, zero duplication
package main

import "testing" // => the assertion runner; vet already checked the verbs

// TestTotal pins exact sums and the single refusal case in one table.
// => rows: two valid invoices plus one carrying a negative quantity
func TestTotal(t *testing.T) { // => table: input invoice, want total, want error
	// => struct rows: name for the subtest, items in, want sum, want refusal
	cases := []struct { // => data holds coverage: three rows, one assertion
		name    string     // => subtest label: failure output names the row
		items   []LineItem // => input: the invoice under test, row by row
		want    int        // => want: exact total cents when valid
		wantErr bool       // => want: true only for the refusal row below
	}{ // => valid single-row, valid multi-row, then the negative-qty refusal
		{"single row", []LineItem{{"oat", 2, 1500}}, 3000, false},                  // => 2x1500
		{"two rows", []LineItem{{"oat", 2, 1500}, {"rice", 1, 2000}}, 5000, false}, // => sum
		{"negative refused", []LineItem{{"oat", -1, 1500}}, 0, true},               // => refused
	}
	// => one loop, one assertion pair: total AND error checked per row
	for _, c := range cases { // => c copies the row: safe to capture below
		t.Run(c.name, func(t *testing.T) { // => named: failures name the invoice
			// => call once, check both halves: sum correct AND error expected
			got, err := Total(c.items) // => the single call under assertion
			// => refusal rows must error; valid rows must total exactly
			if (err != nil) != c.wantErr || got != c.want { // => both halves
				t.Errorf("Total = (%d, %v); want (%d, err=%v)", got, err, c.want, c.wantErr)
			}
		})
	}
}
