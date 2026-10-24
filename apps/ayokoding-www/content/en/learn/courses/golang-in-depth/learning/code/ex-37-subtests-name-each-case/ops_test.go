// Subtests for Decide: immediate, delayed, and exhausted, named and separate.
// => three scenarios, three subtests: each verdict gets its own address
// => independent verdicts: one scenario's failure never masks another's
package main

import "testing" // => Run nests the scenarios under one parent test

// TestDecide covers the whole policy surface in one function, three names.
// => parent groups: `go test -run TestDecide/immediate` runs just one face
func TestDecide(t *testing.T) { // => the policy, all three faces, one place
	// => face one: first-attempt success stops immediately, attempts unused
	t.Run("immediate success", func(t *testing.T) { // => succeeded on attempt 1
		// => used=1 with success: Done regardless of remaining budget
		if got := Decide(true, 1); got != Done { // => success short-circuits
			t.Errorf("Decide(true, 1) = %q, want done", got) // => names the face
		}
	})
	// => face two: failure with budget left means exactly one more try
	t.Run("retry while budget lasts", func(t *testing.T) { // => failed, used 1 of 3
		// => used=1 without success: Retry, two attempts still banked
		if got := Decide(false, 1); got != Retry { // => budget remains: retry
			t.Errorf("Decide(false, 1) = %q, want retry", got) // => names the face
		}
	})
	// => face three: the third failure spends the budget: exhausted, not retry
	t.Run("exhausted at the limit", func(t *testing.T) { // => failed, used all 3
		// => used=3 without success: Exhausted, the budget is spent exactly
		if got := Decide(false, 3); got != Exhausted { // => boundary inclusive
			t.Errorf("Decide(false, 3) = %q, want exhausted", got) // => names it
		}
	})
}
