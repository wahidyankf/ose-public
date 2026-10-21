// Example 19: Parse Numbers with strconv.
//
// External input arrives as text, and strconv converts it with explicit bit
// sizes, so overflow becomes an error instead of a silent wraparound.
package main

import (
	"fmt"     // => prints the parsed port or the precise rejection reason
	"strconv" // => Atoi and ParseUint convert text with explicit widths
)

// parsePort converts port text to a number, rejecting garbage and overflow.
// => bit size 16 matches the TCP port range: the width IS the validation
// => (uint16, error): the width in the signature documents the valid range
func parsePort(text string) (uint16, error) { // => narrow result, honest errors
	// => ParseUint(text, base, bits): base 10, 16 bits for ports 0-65535
	n, err := strconv.ParseUint(text, 10, 16) // => width enforced during parse
	// => two rejections share one path: syntax garbage AND numeric overflow
	if err != nil { // => "abc" fails here, and so does "99999"
		// => %w keeps strconv's detail (syntax vs range) reachable via As
		return 0, fmt.Errorf("bad port %q: %w", text, err) // => context + cause
	}
	// => uint16 conversion is now provably safe: ParseUint already bounded it
	return uint16(n), nil // => narrow only after the width check passed
}

func main() {
	// => valid input: digits inside the 16-bit range convert cleanly
	if port, err := parsePort("8080"); err != nil { // => 8080 fits 16 bits
		fmt.Println("unexpected:", err) // => unreachable: valid port text
	} else {
		fmt.Println("port:", port) // => Output: port: 8080
	}
	// => garbage input: non-digits fail the syntax half of the parse
	if _, err := parsePort("http"); err != nil { // => no digits at all
		fmt.Println("rejected: syntax") // => Output: rejected: syntax
	}
	// => overflow input: digits, but beyond what 16 bits can ever hold
	if _, err := parsePort("99999"); err != nil { // => valid digits, too big
		fmt.Println("rejected: range") // => Output: rejected: range
	}
}
