// Solution: one generic Min replaces both copies, instantiations prove it.
// => [T int | float64]: the type parameter absorbs the only difference
// => call sites infer T: no explicit arguments, reads like the originals
package main

import "fmt" // => prints both minimums from the ONE generic body

// Min returns the smaller of two ordered numerics of any single type.
// => one function: the compiler stamps an int copy and a float64 copy
func Min[T int | float64](a, b T) T { // => T bound to numerics: < always valid
	// => single comparison: written once, reviewed once, trusted twice
	if a < b { // => < valid for every T the constraint admits
		return a // => smaller wins: the only copy of this line left
	}
	return b // => otherwise b wins (or they tie: either fits)
}

func main() {
	// => T inferred int: the stamp that replaced MinInt, call-site silent
	fmt.Println(Min(3, 7)) // => Output: 3
	// => T inferred float64: the stamp that replaced MinFloat, same silence
	fmt.Println(Min(2.5, 1.5)) // => Output: 1.5
}
