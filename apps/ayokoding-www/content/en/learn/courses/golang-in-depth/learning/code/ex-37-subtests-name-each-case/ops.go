// Retry policy: immediate success, one retry, or exhausted attempts.
// => pure decision function: attempts so far in, verdict out, no sleeping
// => testable without clocks: the policy decides, the caller waits elsewhere
package main

// Attempt verdicts: the three faces of a retry policy in one type.
// => string type: verdicts print readably in failures without mapping tables
type Verdict string // => the decision vocabulary for retry loops

// The three verdicts callers switch on after each attempt below.
const (
	Done      Verdict = "done"      // => success: stop retrying, report it
	Retry     Verdict = "retry"     // => failed but attempts remain: try again
	Exhausted Verdict = "exhausted" // => failed with nothing left: give up
)

// Decide maps the attempt outcome to the next step under a three-try policy.
// => (succeeded, used): used counts attempts spent INCLUDING this one
// => pure: same inputs always give the same verdict, clocks stay outside
func Decide(succeeded bool, used int) Verdict { // => decision only, no waiting
	// => success ends the story on any attempt, first or last
	if succeeded { // => the happy path needs no attempt counting at all
		return Done // => done on attempt one, two, or three alike
	}
	// => three attempts spent without success: the policy is exhausted
	if used >= 3 { // => boundary inclusive: the third failure ends it
		return Exhausted // => give up: further attempts break the budget
	}
	return Retry // => failed with budget left: the only remaining verdict
}
