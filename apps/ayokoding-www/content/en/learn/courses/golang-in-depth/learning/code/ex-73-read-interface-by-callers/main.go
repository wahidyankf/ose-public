// Example 73: Read an Interface by Its Callers.
//
// Small interfaces reveal themselves through callers: io.Reader means "ReadAll
// can consume it". A shouting reader below proves the point in twelve lines.
package main

import (
	"fmt"     // => prints the consumed shout: uppercased, fully drained
	"io"      // => Reader and ReadAll: the interface and its canonical caller
	"strings" // => NewReader: the fixed in-memory source the decorator wraps
)

// shout uppercases everything it wraps: a decorator ON an io.Reader.
// => struct holds the wrapped reader: decoration by composition, not flags
type shout struct { // => lowercase: used only inside this file, by design
	src io.Reader // => wrapped source: any Reader qualifies, none excluded
}

// Read fills p with uppercased bytes from the wrapped source below.
// => signature IS io.Reader: (p []byte) (n int, err error), exactly
// => decorator: transforms while delegating, adds no buffering of its own
func (s shout) Read(p []byte) (int, error) { // => value receiver: wraps by value
	// => delegate first: fill p from the source, honoring its n and err
	n, err := s.src.Read(p) // => real bytes land in p[0:n], however many came
	// => uppercase IN PLACE: p[0:n] transforms, length and error pass through
	for i := 0; i < n; i++ { // => only the filled prefix: p[n:] stays garbage
		// => ASCII-only upper: 'a'-'z' shift by 32, everything else untouched
		if p[i] >= 'a' && p[i] <= 'z' { // => guard: letters shift, rest passes
			p[i] -= 'a' - 'A' // => to upper: the decorator's entire transform
		}
	}
	return n, err // => same count, same error: transparent except for case
}

func main() {
	// => fixed string source: any Reader qualifies, this one is deterministic
	src := strings.NewReader("halo sari") // => in-memory: EOF-terminated, never errors
	// => ReadAll consumes ANY Reader to EOF: the caller that defines "readable"
	// => decorating with shout: uppercase applied during the drain, streaming
	out, err := io.ReadAll(shout{src: src}) // => drain through the decorator
	// => drain succeeded: fixed source never errors, EOF ends it cleanly
	if err != nil { // => unreachable: fixedReader only returns EOF, never errors
		fmt.Println("unexpected:", err) // => kept: callers check ReadAll
		return                          // => nothing valid to print on failure
	}
	fmt.Println(string(out)) // => Output: HALO SARI
}
