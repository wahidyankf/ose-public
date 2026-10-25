// Example 2: For Is the Only Loop.
//
// Go has one loop keyword with three forms: counted, conditional, and
// infinite with an explicit exit. Each form below sums the same slice.
package main

import "fmt" // => prints each of the three totals in turn

func main() {
	nums := []int{1, 2, 3, 4} // => the slice every loop form sums below
	// => counted form: init, condition, and step in one header line
	total := 0 // => accumulator starts at the additive identity
	// => i walks the valid indexes; len keeps the bound always correct
	for i := 0; i < len(nums); i++ { // => classic counted repetition
		total += nums[i] // => add each element by its index
	}
	// => conditional form: the header holds only the stay-in condition
	fmt.Println("counted:", total) // => Output: counted: 10
	left := len(nums)              // => counts down how many elements remain unseen
	// => no init or step here: the body owns all progress bookkeeping
	for left > 0 { // => while-style: repeat until nothing remains
		left-- // => progress lives in the body, easy to forget
	}
	// => infinite form: exit only through an explicit break inside
	fmt.Println("drained:", left) // => Output: drained: 0
	forever := 0                  // => counts iterations of the endless loop
	for {                         // => no condition at all: the body decides when to stop
		forever++ // => do the work first, ask about stopping after
		// => break on a plain condition: the only exit this loop has
		if forever == 3 { // => stop after three passes, no more
			break // => leaves the innermost for immediately
		}
	}
	fmt.Println("broken:", forever) // => Output: broken: 3
}
