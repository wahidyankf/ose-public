// Example 68: Flat Beats Nested.
//
// Nested conditionals pyramid rightward; guard clauses return early and keep
// every check at the margin. Both shapes below agree on every input tried.
package main

import "fmt" // => prints both verdicts per applicant: identical, proven

// nested pyramids: each condition indents the next, happy path deepest.
// => correct but rightward-drifting: the fourth check sits four levels deep
// => kept as the "before": the shape flat code replaces, run for equivalence
func nested(age int, member bool, dues bool) string { // => three conditions
	// => each level nests the next: readers hold all prior conditions in mind
	if age >= 17 { // => level one: age gate, everything nests inside
		if member { // => level two: membership, inside the age gate
			if dues { // => level three: dues, inside both gates above
				return "admit" // => happy path: deepest line in the function
			} else {
				return "pay dues" // => failure paths indent too: noise compounds
			}
		} else {
			return "join first" // => which gate failed needs indent-counting
		}
	} else {
		return "too young" // => outermost failure reads last, confusingly
	}
	return "unreachable" // => never reached: structure demands a tail return
}

// flat guards: each failure returns at the margin, happy path last and flat.
// => same policy, zero nesting: conditions read top-down, failures exit early
func flat(age int, member bool, dues bool) string { // => identical signature
	// => guard one: age fails, return at the margin, never indent for it
	if age < 17 { // => inverted condition: failure first, margin-kept
		return "too young" // => exit: the rest of the function forgets age
	}
	// => guard two: membership fails, same margin, age already forgotten
	if !member { // => inverted: non-members leave here, members continue flat
		return "join first" // => exit: remaining code assumes a member
	}
	// => guard three: dues fail, last check, still at the margin
	if !dues { // => inverted: debtors leave, the paid continue to the happy path
		return "pay dues" // => exit: everything below assumes dues are paid
	}
	return "admit" // => happy path: flat, last, assuming all guards passed
}

func main() {
	// => four applicants: admit, young, non-member, debtor: full policy surface
	applicants := [][3]int{{20, 1, 1}, {16, 1, 1}, {20, 0, 1}, {20, 1, 0}}
	// => both shapes must agree on EVERY applicant: equivalence, asserted
	for _, a := range applicants { // => age, member, dues per applicant
		n := nested(a[0], a[1] == 1, a[2] == 1) // => pyramid verdict
		g := flat(a[0], a[1] == 1, a[2] == 1)   // => flat verdict: must match
		// => agree flag: true four times proves the refactor changed no behavior
		fmt.Println(n, g, n == g) // => Output lines: verdict verdict true
	}
}
