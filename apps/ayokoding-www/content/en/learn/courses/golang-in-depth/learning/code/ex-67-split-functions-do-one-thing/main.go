// Example 67: Split Functions Until Each Does One Thing.
//
// One function doing validation, math, and formatting resists testing. Split
// into three, each piece tests alone and the pipeline reads top-down.
package main

import "fmt" // => prints the tangled total and the split total: equal, proven

// tangled validates, totals, and formats in one body: correct but untestable.
// => the three jobs share one function: testing the math runs the formatting
// => kept as the "before": the shape this example argues against, honestly run
func tangled(prices []int) string { // => one function, three responsibilities
	// => validation inline: negatives zeroed, mixed with the math below
	sum := 0 // => accumulator shared across validation and math, tangled
	// => single loop does two jobs: sanitize AND total, inseparably
	for _, p := range prices { // => each pass validates then adds, fused
		if p < 0 { // => validation fused into the totaling loop
			continue // => skip negatives: policy buried mid-math
		}
		sum += p // => math fused with validation: untestable in isolation
	}
	// => formatting fused too: the total renders inside the same body
	return fmt.Sprintf("total: %d", sum) // => three jobs, one test surface
}

// valid drops negatives: the validation piece, testable with pure inputs.
// => pure function: same slice in, clean slice out, no formatting attached
func valid(prices []int) []int { // => one job: sanitize, nothing else
	// => fresh slice: inputs untouched, policy visible in one loop
	out := []int{}             // => empty: negatives vanish, order preserved
	for _, p := range prices { // => the validation loop, isolated and named
		if p >= 0 { // => keep rule: non-negative survives, stated once
			out = append(out, p) // => survivors only: policy as code
		}
	}
	return out // => clean input for the math piece below
}

// sum totals a CLEAN slice: the math piece, no validation inside.
// => pure function: trusted input in, exact total out, nothing else
func sum(nums []int) int { // => one job: add, assuming validity
	total := 0               // => accumulator: validation happened before, not here
	for _, n := range nums { // => the math loop: every element counts
		total += n // => no guards: valid() already promised clean input
	}
	return total // => exact total: testable with two-element slices
}

// render formats a total: the formatting piece, trivially verifiable.
// => pure function: int in, string out, no math and no validation inside
func render(total int) string { // => one job: format, assuming a valid total
	return fmt.Sprintf("total: %d", total) // => the only Sprintf in the pipeline
}

func main() {
	// => tangled pipeline in one call: validate+total+format, fused
	prices := []int{1500, -200, 2000} // => one negative: policy drops it both ways
	fmt.Println(tangled(prices))      // => Output: total: 3500
	// => split pipeline reads as the three steps: valid, then sum, then render
	fmt.Println(render(sum(valid(prices)))) // => Output: total: 3500
}
