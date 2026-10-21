// Grade maps a score to a letter: the function under test below.
// => pure function: no I/O, no state, so table rows fully determine output
// => same logic shape as Example 3: tests now lock that shape in place
package main

// Grade converts a numeric score to a letter grade by band.
// => exported: the test file (same package) calls it directly by name
func Grade(score int) string { // => string result: comparable with ==, no floats
	// => bands descend: first true case wins, mirroring the lesson example
	switch { // => tagless switch: truth cases in strict band order
	case score >= 90: // => top band: checked first so it cannot leak down
		return "A" // => one band, one letter, no fallthrough possible
	case score >= 75: // => second band: reached only below 90
		return "B" // => boundary-inclusive: 75 earns B, not C
	case score >= 60: // => passing floor: the last band before default
		return "C" // => 60 earns C: the comparison stays inclusive
	default: // => everything below 60, including negatives, lands here
		return "F" // => default documents the "no band claimed it" answer
	}
}
