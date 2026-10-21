// Example 69: Cross the Boundary with encoding/binary.
//
// Foreign systems speak bytes, not structs. encoding/binary marshals integers
// to exact wire order: the marshaling half of every FFI and protocol boundary.
package main

import (
	"encoding/binary" // => BigEndian put/get: exact byte order, no guessing
	"fmt"             // => prints the wire bytes and the restored total
)

func main() {
	// => the invoice total from Example 67: now crossing a byte boundary
	const total uint32 = 3500 // => fixed width: wire formats demand exact sizes
	// => four bytes, big-endian: network order, most significant first
	wire := make([]byte, 4) // => exact size: uint32 always marshals to 4 bytes
	// => Put writes the bytes: the Go value becomes foreign-readable data
	binary.BigEndian.PutUint32(wire, total) // => [0 0 13 172]: 3500 in hex
	// => bytes print as decimals: 13*256 + 172 = 3500, verifiable by hand
	fmt.Println(wire) // => Output: [0 0 13 172]
	// => Get reads them back: the unmarshaling half, same order, same width
	back := binary.BigEndian.Uint32(wire) // => 3500: the round trip is exact
	// => equality proves the boundary crossing lost nothing in translation
	fmt.Println(back == total) // => Output: true
}
