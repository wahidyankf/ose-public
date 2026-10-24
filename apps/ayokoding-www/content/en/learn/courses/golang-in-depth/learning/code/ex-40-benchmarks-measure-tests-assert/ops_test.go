// Test plus benchmark for Sum: assert correctness, measure the loop.
// => TestSum guards the answer; BenchmarkSum times it with -benchtime=1x
// => run command counts Benchmark lines: proves the benchmark really ran
package main

import "testing" // => B carries N (iteration count) and timing to the bench

// TestSum pins the answer on a fixed input: correctness first, always.
// => fixed slice: 1+2+3+4 = 10, no randomness, no clock, ever
func TestSum(t *testing.T) { // => the assertion half of the pair
	// => one call, one comparison: the whole contract in two lines
	if got := Sum([]int{1, 2, 3, 4}); got != 10 { // => exact: ints, no epsilon
		t.Errorf("Sum = %d, want 10", got) // => names the wrong total directly
	}
}

// BenchmarkSum times the loop: speed second, measured honestly.
// => b.N scales automatically: the runner picks iterations to fill benchtime
// => no assertions inside: benchmarks measure, they never pass or fail
func BenchmarkSum(b *testing.B) { // => *testing.B, not *testing.T: measure mode
	// => fixed input OUTSIDE the loop: setup costs must not pollute timing
	nums := []int{1, 2, 3, 4} // => same slice the test asserts on: linked pair
	// => the measured loop: b.N iterations of exactly the call under test
	for i := 0; i < b.N; i++ { // => runner sets N: more time, more iterations
		Sum(nums) // => result discarded: timing the call, not the check
	}
}
