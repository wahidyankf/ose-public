// Sum adds a slice of ints: asserted by a test, measured by a benchmark.
// => the SAME function serves both: correctness and speed stay linked
// => loop shape matters for the benchmark: index loops avoid range copies
package main

// Sum totals the slice with an index loop: no copies, no allocations.
// => exported: tests and benchmarks in this package call it by name
func Sum(nums []int) int { // => int result: exact, no float anywhere
	// => accumulator starts at zero: the additive identity, stated once
	total := 0 // => grows by exactly the slice contents, nothing else
	// => index loop: avoids the per-element copy range would make
	for i := 0; i < len(nums); i++ { // => bound from len: always in range
		total += nums[i] // => add the stored element, never a copy
	}
	return total // => the exact total: benchmark measures THIS loop
}
