// Solution: each layer wraps with %w, context accumulates honestly.
// => chain reads request -> save -> sentinel: every frame named, Is intact
// => errors.Is proves the wrap preserved matching: the behavior contract holds
package main

import (
	"errors" // => Is walks the wrapped chain to find the sentinel below
	"fmt"    // => prints the full chain plus the Is verdict that proves it
)

// ErrEmpty is the shared sentinel: identity-compared through every wrap.
var ErrEmpty = errors.New("nothing to save") // => one instance, Is-matched

// save wraps the sentinel once: the repository layer names its context.
// => %w links: context added, identity preserved, Is still matches through
func save(payload string) error { // => single wrap: this layer's frame added
	if payload == "" { // => guard: the domain failure this function owns
		return fmt.Errorf("save record: %w", ErrEmpty) // => linked, not flat
	}
	return nil // => non-empty: nothing to report, success shape
}

func main() {
	// => caller wraps again: the service frame joins the chain honestly
	err := fmt.Errorf("handle request: %w", save("")) // => chain of three links
	// => full chain prints: every layer's context in order, no frame lost
	fmt.Println(err) // => Output: handle request: save record: nothing to save
	// => Is walks through both wraps: matching survives context, proven here
	fmt.Println("matches:", errors.Is(err, ErrEmpty)) // => Output: matches: true
}
