// Example 52: Yield Sequences with iter.
//
// Range-over-func lets a type define its own iteration with an iter.Seq,
// yielding values lazily. The countdown below allocates nothing to iterate.
package main

import (
	"fmt"  // => prints the yielded countdown, then the collected slice
	"iter" // => Seq: the pull-iteration signature range-over-func consumes
)

// Countdown returns a sequence yielding n down to 1, then stopping.
// => iter.Seq[int]: yields ints; the caller ranges it like any slice
// => lazy: values materialize one per pass, never as a stored slice
func Countdown(n int) iter.Seq[int] { // => returns the sequence, runs nothing yet
	// => the closure runs only while ranged: each yield pauses it mid-loop
	return func(yield func(int) bool) { // => yield returns false to stop early
		// => counts down: the loop body yields, the caller decides to continue
		for i := n; i >= 1; i-- { // => 3, 2, 1: then the loop simply ends
			// => false from yield means "stop": break honors early exit
			if !yield(i) { // => yield the value; stop if the caller broke out
				return // => early break respected: no wasted iterations
			}
		}
	}
}

func main() {
	// => range over the sequence: each pass resumes the closure at yield
	started := false              // => separator flag: space BEFORE each value except the first
	for v := range Countdown(3) { // => 3, then 2, then 1: lazily, no slice
		// => separator-before pattern: no trailing space, output stays clean
		if started { // => first value prints bare, the rest earn a separator
			fmt.Print(" ") // => separator between values, never after the last
		}
		fmt.Print(v)   // => the value itself: 3, then 2, then 1, in order
		started = true // => first value done: every later value gets a space
	}
	fmt.Println() // => newline: ends the space-separated countdown line
	// => sequences compose with plain loops: collect only when storage is wanted
	collected := []int{} // => empty: appends grow it from the lazy sequence
	// => break early: yield's false path stops the closure after two values
	for v := range Countdown(10) { // => would yield 10 down to 1, unbounded use
		// => stop after two: laziness means the other eight never compute
		if len(collected) == 2 { // => collected [10 9]: enough, stop here
			break // => break becomes yield-false inside the closure: clean stop
		}
		collected = append(collected, v) // => keep the yielded value, continue
	}
	fmt.Println(collected) // => Output: [10 9]
}
