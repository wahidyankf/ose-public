// Fuzz test for Reverse: seeds run as unit cases on every go test.
// => seed corpus: three inputs pinned as regression cases, always executed
// => property asserted: reversing twice returns the original, for ANY input
package main

import "testing" // => Fuzz targets need *testing.F: the fuzzing handle

// FuzzReverse checks the double-reversal property over seeds (and future fuzzing).
// => plain `go test` runs ONLY the seeds: deterministic, no time budget spent
// => `go test -fuzz=FuzzReverse` would explore beyond seeds: opt-in, not default
func FuzzReverse(f *testing.F) { // => *testing.F: Add seeds, then Fuzz the property
	// => seeds: empty, ASCII, and multi-byte: the three shapes that matter
	f.Add("")       // => empty: degenerate input, must round-trip trivially
	f.Add("golang") // => ASCII: the common case, byte-safe either way
	f.Add("sore世界") // => multi-byte: byte-flipping would corrupt 世界 here
	// => the property: Reverse(Reverse(s)) == s for every input the corpus holds
	f.Fuzz(func(t *testing.T, s string) { // => t fails the seed that breaks it
		// => double reversal must restore: the invariant, stated as code
		if got := Reverse(Reverse(s)); got != s { // => any mismatch fails loudly
			t.Errorf("Reverse(Reverse(%q)) = %q", s, got) // => quotes both sides
		}
	})
}
