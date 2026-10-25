// Example 46: Constraints Name What Operations Need.
//
// A constraint lists the operations a generic function relies on. cmp.Ordered
// covers every ordered type, so Clamp works for ints, floats, and strings.
package main

import (
	"cmp" // => Ordered: the stdlib constraint for every ordered type
	"fmt" // => prints clamped ints, floats, and strings in turn
)

// Clamp forces v into [lo, hi]: below lo becomes lo, above hi becomes hi.
// => [T cmp.Ordered]: the constraint IS the operations list (<, >, ==)
// => strings qualify: "m" clamps between "a" and "z" alphabetically, free
func Clamp[T cmp.Ordered](v, lo, hi T) T { // => three same-type values in-out
	// => lower bound first: values below the floor rise to meet it
	if v < lo { // => < valid on every Ordered type: ints, floats, strings
		return lo // => floor wins: the result never drops below lo
	}
	// => upper bound second: values above the ceiling fall back to it
	if v > hi { // => > pairs with <: the constraint promises both directions
		return hi // => ceiling wins: the result never exceeds hi
	}
	return v // => inside the band: untouched, returned as received
}

func main() {
	// => int clamp: 99 exceeds the ceiling, so hi answers instead
	fmt.Println(Clamp(99, 1, 10)) // => Output: 10
	// => float clamp: -0.5 drops below the floor, so lo answers instead
	fmt.Println(Clamp(-0.5, 0.0, 1.0)) // => Output: 0
	// => string clamp: alphabetical band keeps "mango" where it already sits
	fmt.Println(Clamp("mango", "apple", "zebra")) // => Output: mango
}
