// Example 3: Switch Without a Tag.
//
// A switch with no operand switches on truth, turning an if-else ladder
// into a flat list of named cases. Cases never fall through by default.
package main

import "fmt" // => prints the grade exactly one case selects

// grade maps a numeric score to a letter with a truth-switch.
// => ordered cases: the first true one wins, so ranges stay disjoint
// => each case ends the switch automatically: no break needed, ever
func grade(score int) string { // => pure function: same input, same letter
	// => tagless switch: every case is a boolean expression on score
	switch { // => reads as "the first of these that holds, wins"
	// => highest band first, or a lower case would steal its inputs
	case score >= 90: // => top band: 90 and above
		return "A" // => return exits the function, hence the switch
	// => 75 to 89 lands here because 90-plus already returned above
	case score >= 75: // => second band: order is the logic
		return "B" // => one case, one letter, no overlap possible
	// => 60 to 74: the last passing band before the default below
	case score >= 60: // => passing floor for this grading scheme
		return "C" // => every band returns, so no case falls through
	default: // => catches everything no case claimed, including negatives
		return "F" // => default documents the "nothing matched" answer
	}
}

func main() {
	// => one call per band boundary, proving the order does the work
	fmt.Println(grade(95)) // => Output: A
	fmt.Println(grade(85)) // => Output: B
	fmt.Println(grade(55)) // => Output: F
}
