package main

import "fmt"

func main() { // => Compares equal printed values with different array and slice types.
	array := [3]int{1, 2, 3}  // => Its length 3 is part of its type.
	slice := []int{1, 2, 3}   // => The slice type has no fixed length.
	fmt.Println(array, slice) // => Both print [1 2 3] here.
}
