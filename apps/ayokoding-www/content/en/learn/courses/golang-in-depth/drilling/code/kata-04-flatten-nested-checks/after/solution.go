// Solution: guard clauses at the margin. Same policy, flat shape.
// => inverted conditions return early: failures exit, the happy path stays last
// => four applicants prove equivalence: flat agrees with nested on every input
package main

import "fmt" // => prints four flat verdicts: admit, young, join, dues

// flat guards three gates at the margin: failure returns, success continues.
// => same policy as nested: inverted conditions, zero indentation growth
func flat(age int, member bool, dues bool) string { // => identical signature
	// => guard one: age fails, return at the margin, forget age below
	if age < 17 { // => inverted: failure first, margin kept
		return "too young" // => exit: remaining code assumes adult applicant
	}
	// => guard two: membership fails at the same margin, age already handled
	if !member { // => inverted: non-members leave, members continue flat
		return "join first" // => exit: remaining code assumes a member
	}
	// => guard three: dues fail last, still at the margin, never nested
	if !dues { // => inverted: debtors leave, the paid reach the happy path
		return "pay dues" // => exit: everything below assumes dues are paid
	}
	return "admit" // => happy path: flat, last, assuming all guards passed
}

func main() {
	// => four applicants: admit, too young, join first, pay dues: full surface
	fmt.Println(flat(20, true, true))  // => Output: admit
	fmt.Println(flat(16, true, true))  // => Output: too young
	fmt.Println(flat(20, false, true)) // => Output: join first
	fmt.Println(flat(20, true, false)) // => Output: pay dues
}
