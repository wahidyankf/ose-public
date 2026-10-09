package main

import "fmt"

func increment(value *int) { *value++ } // => Dereference then increment the caller's integer.

func main() { // => Passes an address so increment can update the caller’s variable.
	value := 7         // => Initial value before the call.
	increment(&value)  // => Pass its address so the function can write to it.
	fmt.Println(value) // => Output: 8.
}
