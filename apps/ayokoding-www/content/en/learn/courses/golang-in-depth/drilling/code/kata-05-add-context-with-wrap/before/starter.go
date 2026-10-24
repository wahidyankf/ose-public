// Starter: bare sentinel, no context. The gap: WHICH step failed?
// => every layer returns ErrEmpty unchanged: the message never says where
// => rewrite: wrap with %w per layer, following Example 11's linked chain
package main

import (
	"errors" // => the bare sentinel, returned unchanged at every layer
	"fmt"    // => prints the context-free failure: informative nowhere
)

// ErrEmpty is the shared "nothing to save" sentinel from Example 12's shape.
var ErrEmpty = errors.New("nothing to save") // => one instance, compared by Is

// save refuses empty payloads with the bare sentinel: no layer context at all.
// => BUG-shape: callers learn WHAT failed but never WHICH step owned it
func save(payload string) error { // => returns ErrEmpty naked, context-free
	if payload == "" { // => guard: the only check this function owns
		return ErrEmpty // => naked: which caller, which step? unknowable
	}
	return nil // => non-empty: nothing to report, success shape
}

func main() {
	// => the failure prints bare: "nothing to save" with no step attached
	fmt.Println(save("")) // => context-free: WHICH save failed stays hidden
}
