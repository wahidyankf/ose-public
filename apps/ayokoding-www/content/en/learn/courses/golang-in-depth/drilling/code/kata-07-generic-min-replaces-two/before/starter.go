// Starter: two Mins, one idea. The duplication: logic copied per type.
// => MinInt and MinFloat differ only in their type names: pure duplication
// => rewrite: one generic Min[T int | float64], following Example 45's shape
package main

import "fmt" // => prints both minimums: correct, but from two cloned bodies

// MinInt returns the smaller of two ints: copy one of two identical logics.
// => int-only: floats need the twin below, same body, different signature
func MinInt(a, b int) int { // => first copy: the idea, bound to int
	if a < b { // => same comparison the float twin repeats verbatim
		return a // => smaller wins: logic identical to MinFloat below
	}
	return b // => otherwise b: duplicated line, duplicated review burden
}

// MinFloat returns the smaller of two floats: copy two of the same idea.
// => float-only: the twin the generic will absorb into one function
func MinFloat(a, b float64) float64 { // => second copy: the idea, bound to float64
	if a < b { // => verbatim repeat: the duplication this kata removes
		return a // => smaller wins: same sentence, second spelling
	}
	return b // => otherwise b: two copies to keep in sync, forever
}

func main() {
	// => both copies work: the complaint is maintenance, not behavior
	fmt.Println(MinInt(3, 7), MinFloat(2.5, 1.5)) // => 3 and 1.5: correct twice
}
