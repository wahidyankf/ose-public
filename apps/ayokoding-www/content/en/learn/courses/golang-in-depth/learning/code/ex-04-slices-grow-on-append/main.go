// Example 4: Slices Grow on Append.
//
// A slice is a view over an array plus a length. Append grows the view,
// copying to a bigger array only when the capacity runs out.
package main

import "fmt" // => prints length and capacity after every growth step

func main() {
	// => len 0, cap 0: the nil slice, valid and ready to append to
	var names []string // => nil slice: append works, indexing does not yet
	// => len reports visible elements; cap reports room before copying
	fmt.Println(len(names), cap(names)) // => Output: 0 0
	// => append returns the new view: always keep its result, never drop it
	names = append(names, "sari") // => first element: allocates an array of 1
	// => capacity doubling is the runtime's growth policy, not a promise
	fmt.Println(len(names), cap(names)) // => Output: 1 1
	// => two appends at once: the view grows by two in a single call
	names = append(names, "budi", "citra") // => len 3 now exceeds cap 1: copy
	// => the copy moved elements to a roomier array invisibly to you
	fmt.Println(len(names), cap(names)) // => Output: 3 4
	// => reslicing narrows the view; the array underneath is untouched
	first := names[:1] // => shares the same backing array, no copying
	// => len counts the view, so first sees one element of the same three
	fmt.Println(len(first), first[0]) // => Output: 1 sari
}
