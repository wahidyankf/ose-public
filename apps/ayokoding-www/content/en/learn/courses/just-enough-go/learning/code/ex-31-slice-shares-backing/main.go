package main

import "fmt"

func main() { // => Shows a subslice changing the original backing array.
	values := []int{1, 2, 3}  // => Original backing array holds three integers.
	view := values[:2]        // => View covers the first two elements of that array.
	view[0] = 9               // => The write also changes values[0].
	fmt.Println(values, view) // => Output: [9 2 3] [9 2].
}
