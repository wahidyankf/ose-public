// Example 50: Copy Slices Before You Keep Them.
//
// Slices alias their backing array, so keeping a subslice keeps the whole
// array alive. Clone before storing, and the transient bulk can be freed.
package main

import (
	"fmt"    // => prints the kept payload and proves the alias is broken
	"slices" // => Clone copies: the stdlib alias-breaker since Go 1.21
)

func main() {
	// => a "packet": 2-byte header plus a 3-byte payload we actually want
	packet := []byte{'H', 'D', 'p', 'a', 'y'} // => header HD, payload pay
	// => subslice aliases: payload shares the packet's backing array still
	payload := packet[2:] // => [p a y]: a view, NOT a copy, memory still shared
	// => Clone copies the view into a fresh array: the alias ends here
	kept := slices.Clone(payload) // => [p a y]: same bytes, independent array
	// => mutate the ORIGINAL packet: the kept clone must not flinch
	packet[2] = 'X' // => overwrite payload byte in the shared original array
	// => independent arrays: original changed, clone holds the true payload
	fmt.Println(string(packet[2:])) // => Output: Xay
	fmt.Println(string(kept))       // => Output: pay
	// => Clone of nil stays nil: no allocation, no surprise empty slice
	fmt.Println(slices.Clone([]byte(nil)) == nil) // => Output: true
}
