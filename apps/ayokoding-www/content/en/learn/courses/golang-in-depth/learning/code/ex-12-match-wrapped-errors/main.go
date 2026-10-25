// Example 12: Match Wrapped Errors with errors.Is.
//
// Once errors are wrapped, == stops working and errors.Is takes over: it
// walks the whole chain looking for the sentinel, however deep it sits.
package main

import (
	"errors" // => Is walks chains built from errors made here
	"fmt"    // => prints whether each chain contains the sentinel
)

// ErrEmpty is the sentinel this example buries under two wraps on purpose.
// => shared instance again: Is compares identity at every chain link
var ErrEmpty = errors.New("nothing to save") // => the needle for Is below

// save refuses empty payloads with the sentinel, wrapped once for context.
// => one wrap here stands for "the repository layer added its context"
func save(payload string) error { // => (nothing, error): only failure matters
	// => empty input is the domain failure this function owns outright
	if payload == "" { // => guard on the input before any work starts
		// => wrap once: the sentinel travels with its first context frame
		return fmt.Errorf("save record: %w", ErrEmpty) // => chain of two
	}
	return nil // => non-empty payload: nothing to report
}

func main() {
	// => the caller wraps AGAIN, the way real call stacks accumulate frames
	err := save("") // => chain: caller context -> save context -> sentinel
	// => add the outermost frame exactly as a service entry point would
	if err != nil { // => always non-nil here: the payload was empty
		err = fmt.Errorf("handle request: %w", err) // => chain of three now
	}
	// => == compares only the top link: the outer wrap is a different value
	fmt.Println("equal:", err == ErrEmpty) // => Output: equal: false
	// => Is unwraps link by link until it finds the sentinel's identity
	fmt.Println("matches:", errors.Is(err, ErrEmpty)) // => Output: matches: true
	// => a sentinel never placed in the chain correctly reports absence
	fmt.Println("other:", errors.Is(err, errors.New("x"))) // => Output: other: false
}
