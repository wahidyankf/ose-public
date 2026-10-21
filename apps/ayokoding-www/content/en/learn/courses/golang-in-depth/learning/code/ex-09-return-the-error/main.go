// Example 9: Return the Error, Not the Exception.
//
// Go reports failure as an ordinary return value, and the caller decides
// what it means at the call site. No throw, no catch, no hidden path.
package main

import (
	"errors" // => builds the divide-by-zero failure value below
	"fmt"    // => prints the quotient or the failure, never both
)

// divide guards the one input pair it cannot serve: a zero divisor.
// => (int, error) is the conventional shape: result first, failure second
// => callers must name the error: ignoring it is a visible choice, not luck
func divide(a, b int) (int, error) { // => two results: value plus failure
	// => the guard names the exact precondition arithmetic requires
	if b == 0 { // => division by zero is undefined, so refuse it here
		// => zero value plus failure: the caller must check before using q
		return 0, errors.New("divide by zero") // => caller sees both halves
	}
	// => only reachable with a nonzero divisor: the math is safe now
	return a / b, nil // => quotient plus nil: success needs no comment
}

func main() {
	// => success path first: valid input yields a quotient and nil error
	q, err := divide(10, 2) // => q 5, err nil: both halves carry meaning
	// => check before use: reading q while err is set is the classic bug
	if err != nil { // => nil skips this: success stays on the margin
		fmt.Println("error:", err) // => unreachable on this input
	} else {
		fmt.Println("quotient:", q) // => Output: quotient: 5
	}
	// => failure path: zero divisor yields zero value plus a real error
	q, err = divide(10, 0) // => q 0, err set: q is meaningless until checked
	// => same check shape: the call site treats both outcomes uniformly
	if err != nil { // => non-nil error takes the failure branch here
		fmt.Println("error:", err) // => Output: error: divide by zero
	}
}
