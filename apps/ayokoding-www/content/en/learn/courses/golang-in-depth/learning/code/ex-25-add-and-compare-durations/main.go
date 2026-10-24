// Example 25: Add and Compare Durations.
//
// Durations are int64 nanoseconds with constructors like time.Hour, so deadline
// math is plain arithmetic instead of fragile unit juggling in your head.
package main

import (
	"fmt"  // => prints the window, the remainder, and the dispatch verdict
	"time" // => Hour, Minute: named constructors beat raw multiplication
)

func main() {
	// => the delivery window: two hours, stated in the unit humans think in
	window := 2 * time.Hour // => Duration arithmetic starts from named units
	// => elapsed so far: 45 minutes of loading inside the two-hour window
	elapsed := 45 * time.Minute // => Minute constructor: no magic 60s anywhere
	// => subtraction on Durations: the remainder is exact to the nanosecond
	remaining := window - elapsed // => 1h15m0s: plain minus, honest units
	// => String renders canonically: hours, minutes, seconds, skipping zeros
	fmt.Println("remaining:", remaining) // => Output: remaining: 1h15m0s
	// => a job needs one full hour: comparison decides dispatch, no floats
	job := time.Hour // => the candidate job's runtime, same unit family
	// => <= on Durations: deadline checks read as the sentence they mean
	if job <= remaining { // => fits: dispatch it inside the window
		fmt.Println("dispatch: fits") // => Output: dispatch: fits
	} else {
		fmt.Println("dispatch: defer") // => unreachable: 1h fits in 1h15m
	}
	// => Hours converts to float for reporting: math stays in Duration first
	fmt.Println("hours left:", remaining.Hours()) // => Output: hours left: 1.25
}
