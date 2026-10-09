package main

import "fmt"

func sum(values ...int) int { // => values is a []int inside sum, regardless of call argument count.
	total := 0                     // => The running total starts at zero, so an empty call returns zero.
	for _, value := range values { // => Visit each supplied integer once.
		total += value // => Add the current element to the accumulated total.
	}
	return total // => Return the sum after all arguments have been consumed.
}

func main() { // => The two calls use direct arguments and a spread slice.
	values := []int{4, 5}                     // => values is [4, 5] before expansion at the call site.
	fmt.Println(sum(1, 2, 3), sum(values...)) // => Output: 6 9.
}
