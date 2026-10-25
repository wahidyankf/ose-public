// Starter: pyramid admission checks. The smell: happy path deepest.
// => three nested ifs: readers count indentation to find which gate failed
// => rewrite: guard clauses at the margin, following Example 68's flat shape
package main

import "fmt" // => prints the pyramid verdict: correct, but rightward-drifting

// nested pyramids three gates: age, member, dues: deepest line is the prize.
// => correct logic, costly shape: every failure needs indent-counting to place
func nested(age int, member bool, dues bool) string { // => three conditions in
	if age >= 17 { // => level one: everything else nests inside the age gate
		if member { // => level two: membership, inside age
			if dues { // => level three: dues, inside both gates above
				return "admit" // => happy path: deepest line, hardest to find
			}
			return "pay dues" // => mid-level failure: indentation says where
		}
		return "join first" // => level-two failure: count braces to place it
	}
	return "too young" // => outermost failure reads last: backwards emphasis
}

func main() {
	// => one applicant through the pyramid: admitted, but found deep inside
	fmt.Println(nested(20, true, true)) // => admit: correct, rightward journey
}
