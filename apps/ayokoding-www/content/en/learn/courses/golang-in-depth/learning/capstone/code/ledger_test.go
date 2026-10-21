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
