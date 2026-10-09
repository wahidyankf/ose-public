package main

import "fmt"

func main() { // => Tracks length and capacity through three appends.
	values := make([]int, 0, 2) // => Zero elements, space reserved for two.
	// => Append 0, 1, then 2; the third append exceeds initial capacity.
	for i := 0; i < 3; i++ { // => i takes values 0, 1, then 2.
		values = append(values, i)            // => Length increases each time.
		fmt.Println(len(values), cap(values)) // => Capacity may grow when needed.
	}
}
