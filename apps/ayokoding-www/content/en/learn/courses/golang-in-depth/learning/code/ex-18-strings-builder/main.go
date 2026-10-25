// Example 18: Build Strings with strings.Builder.
//
// Concatenating in a loop with += copies the growing string every pass.
// strings.Builder amortizes that cost the way append does for slices.
package main

import (
	"fmt"     // => prints the assembled line and its final length
	"strings" // => Builder is the amortized string accumulator
)

func main() {
	// => cells of one CSV row, joined below without any += copying
	cells := []string{"sari", "41", "jakarta"} // => input: three plain fields
	// => Builder holds a byte slice internally: writes append, never copy
	var b strings.Builder // => zero value is ready: no constructor needed
	// => Grow hints the final size up front: one allocation when known
	b.Grow(20) // => optional: skips even the amortized regrowth here
	// => index loop: every cell but the first earns a leading comma
	for i, c := range cells { // => range gives position and cell together
		// => separator before content: no trailing-comma cleanup afterwards
		if i > 0 { // => first cell skips the separator, the rest take one
			b.WriteString(",") // => WriteString never fails: no error to check
		}
		// => WriteString appends bytes; plain strings need no conversion
		b.WriteString(c) // => the cell itself lands after its separator
	}
	// => String freezes the accumulated bytes into one immutable string
	fmt.Println(b.String()) // => Output: sari,41,jakarta
	// => Len reports accumulated bytes: the Grow hint plus content exactly
	fmt.Println("len:", b.Len()) // => Output: len: 15
}
