// Example 51: Compare with cmp Instead of ==.
//
// == panics on funcs and misleads on floats; the cmp package compares
// honestly, with NaN-aware float comparison and three-way ordering.
package main

import (
	"cmp" // => Compare and Or: honest three-way comparison, stdlib since 1.21
	"fmt" // => prints the three-way verdicts for strings, ints, and floats
)

func main() {
	// => Compare returns -1, 0, or +1: richer than a boolean, sortable directly
	fmt.Println(cmp.Compare("sari", "budi")) // => Output: 1
	// => equal values compare 0: the "no difference" answer, explicit
	fmt.Println(cmp.Compare(41, 41)) // => Output: 0
	// => Or chains fallbacks: first non-zero wins, like a tiebreak ladder
	// => compares (1,1): 0, falls to (2,3): -1: the first difference decides
	fmt.Println(cmp.Or(cmp.Compare(1, 1), cmp.Compare(2, 3))) // => Output: -1
	// => NaN-aware: Compare treats NaN as LESS than everything, deterministic
	// => == on NaN is always false, even against itself: Compare fixes that
	fmt.Println(cmp.Compare(float64(1), float64(1))) // => Output: 0
}
