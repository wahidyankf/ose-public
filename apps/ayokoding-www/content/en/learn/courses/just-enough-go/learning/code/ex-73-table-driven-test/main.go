package main

import "fmt"

func double(value int) int { return value * 2 } // => Function under the two cases below.

func main() { // => Evaluates two table rows against double.
	for _, test := range []struct{ in, want int }{{2, 4}, {3, 6}} { // => Inputs 2 and 3 expect 4 and 6.
		fmt.Println(double(test.in) == test.want) // => Prints true for both cases.
	}
}
