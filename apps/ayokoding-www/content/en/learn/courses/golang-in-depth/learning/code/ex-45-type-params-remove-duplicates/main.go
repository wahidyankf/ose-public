// Example 45: Type Parameters Remove Duplicates.
//
// Without generics, Min for ints and Min for floats are two copies of one
// idea. A type parameter writes it once and instantiates it per type.
package main

import (
	"fmt" // => prints the int minimum and the float minimum side by side
)

// Min returns the smaller of two ordered values of any single type.
// => [T int | float64]: the type parameter list, right after the name
// => one function: the compiler stamps a copy per type used at call sites
func Min[T int | float64](a, b T) T { // => T bound to ordered numerics only
	// => single comparison: identical logic serves both instantiations
	if a < b { // => < valid because the constraint promises ordering
		return a // => first is smaller: return it unchanged
	}
	return b // => otherwise the second is smaller (or they tie: either fits)
}

func main() {
	// => T inferred as int: no explicit type argument needed at the call
	fmt.Println(Min(3, 7)) // => Output: 3
	// => same function, T inferred as float64: the second instantiation
	fmt.Println(Min(2.5, 1.5)) // => Output: 1.5
	// => explicit instantiation also compiles: rarely needed, always allowed
	fmt.Println(Min[int](9, 4)) // => Output: 4
}
