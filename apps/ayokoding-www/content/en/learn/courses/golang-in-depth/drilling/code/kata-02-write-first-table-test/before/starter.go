// Starter: an untested Double. The gap: no test pins its behavior.
// => Double works but nothing proves it: add calc_test.go in after/
// => follow Example 35: table rows for zero, positive, and negative inputs
package main

// Double returns twice its input: correct today, unguarded against tomorrow.
// => the deliverable: a table test pinning 0, positive, and negative cases
func Double(n int) int { // => pure: trivially testable, currently untested
	return n * 2 // => the logic the missing test must lock in place
}
