// Reverse flips a string rune-wise: correct for multi-byte text.
// => rune slice, not byte flip: bytes would split multi-byte characters
// => double-reversal property: the invariant the fuzz test asserts below
package main

// Reverse returns the string with its runes in reverse order.
// => []rune conversion first: characters, not bytes, are the unit reversed
func Reverse(s string) string { // => pure: same input, same reversal, always
	// => runes copy the string once: the reversal then swaps in place safely
	r := []rune(s) // => one allocation: characters addressable by index
	// => two-pointer swap: ends walk inward, meeting exactly in the middle
	for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 { // => no middle double-swap
		r[i], r[j] = r[j], r[i] // => parallel assign: no temp variable needed
	}
	return string(r) // => back to string: the reversed text, freshly built
}
