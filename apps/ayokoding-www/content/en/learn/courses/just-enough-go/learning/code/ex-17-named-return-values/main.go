package main

import "fmt"

func bounds(values []int) (small, large int) { // => Named results start at zero and are local variables inside bounds.
	small, large = values[0], values[0] // => Seed both bounds from the first element; this example requires a nonempty slice.
	for _, value := range values {      // => Visit every candidate, including the first seeded value.
		if value < small { // => A smaller candidate replaces the current minimum.
			small = value // => small now holds the lowest value seen so far.
		}
		if value > large { // => A larger candidate replaces the current maximum.
			large = value // => large now holds the highest value seen so far.
		}
	}
	return // => Bare return sends the current small and large results to the caller.
}

func main() { fmt.Println(bounds([]int{3, 1, 4})) } // => Output: 1 4, in the same order as the named results.
