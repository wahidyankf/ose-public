package main

import "fmt"

func main() { // => The declarations below begin with their type-specific zero values.
	var n int                                // => n is 0 before assignment.
	var s string                             // => s is the empty string before assignment.
	var ok bool                              // => ok is false before assignment.
	var p *int                               // => p is nil before it points at an integer.
	fmt.Printf("%d %q %t %v\n", n, s, ok, p) // => Output: 0 "" false <nil>.
}
