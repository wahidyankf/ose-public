package main

import "fmt"

func main() { // => Shows why append’s returned slice must be retained.
	values := []int{1, 2}      // => Initial length is 2.
	values = append(values, 3) // => Assign the returned slice; length becomes 3.
	fmt.Println(values)        // => Output: [1 2 3].
}
