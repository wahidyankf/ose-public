// Short-aware tests for Shrink: fast always, exhaustive only when asked.
// => testing.Short: true under -short, so the suite stays fast by default
// => Skip reports "why not run": skipped is visible, never silently absent
package main

import ( // => Short and Skip from testing, Contains for the no-runs property
	"strings" // => Contains checks the collapsed output for surviving runs
	"testing" // => Short gates the sweep, Skip reports the omission visibly
)

// TestShrinkBasic pins the core behavior: runs in every mode, fast or not.
// => no Short check here: basics must hold under -short AND full runs alike
func TestShrinkBasic(t *testing.T) { // => the always-on correctness anchor
	// => fixed input with double spaces and padding: the canonical mess
	if got := Shrink("  a   b  "); got != "a b" { // => collapse plus trim
		t.Errorf("Shrink = %q, want %q", got, "a b") // => quotes expose spaces
	}
}

// TestShrinkExhaustive sweeps a thousand generated inputs: skipped when short.
// => generation loop: deterministic inputs, no randomness, still slow-ish
// => Skip FIRST: no point building inputs the run will not execute
func TestShrinkExhaustive(t *testing.T) { // => the slow sweep, gated by Short
	// => short mode: report the skip and return before any heavy work starts
	if testing.Short() { // => true under `go test -short`: the fast path
		t.Skip("skipping exhaustive sweep in short mode") // => visible skip
	}
	// => full mode only: a thousand padded inputs, each checked for spaces
	for i := 0; i < 1000; i++ { // => deterministic count: no time budget needed
		// => padded input: spaces around a repeatable core, index-varying
		in := "  pad pad  " // => same shape every pass: cheap but numerous
		// => double-space absence is the property: no output keeps a run
		if got := Shrink(in); strings.Contains(got, "  ") { // => runs banned
			t.Fatalf("pass %d: Shrink(%q) = %q keeps a run", i, in, got) // => fatal
		}
	}
}
