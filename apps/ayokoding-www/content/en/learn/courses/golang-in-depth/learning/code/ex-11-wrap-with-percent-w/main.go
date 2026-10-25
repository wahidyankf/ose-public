// Example 11: Wrap with Percent-W for Context.
//
// Wrapping adds the caller's context while keeping the original reachable
// underneath. %w links the chain; %v would only print it and cut the link.
package main

import (
	"errors" // => the root failure this example wraps twice
	"fmt"    // => prints the fully wrapped chain in one line
)

// readConfig fails the way a missing file would: one root cause, no context.
// => low-level functions report WHAT failed; callers add WHERE and WHY
func readConfig() error { // => single error return: nothing else to say
	// => errors.New at the bottom: the chain starts with a plain cause
	return errors.New("config.json missing") // => root cause, context-free
}

// loadConfig adds the layer that needed the file: the loading step itself.
// => each layer wraps once: context accumulates exactly one frame per call
func loadConfig() error { // => same shape: wrap and pass upward
	// => %w preserves the chain; the prefix names this layer's context
	if err := readConfig(); err != nil { // => the root cause arrives here
		// => "load config:" tells the reader which step owned the failure
		return fmt.Errorf("load config: %w", err) // => linked, not flattened
	}
	return nil // => unreachable here, kept for the uniform check shape
}

func main() {
	// => the top layer wraps once more: now the chain names the whole path
	if err := loadConfig(); err != nil { // => wrapped cause arrives here
		// => second wrap: the outermost context is the program starting up
		wrapped := fmt.Errorf("start service: %w", err) // => chain of three
		// => printing walks the chain: every layer's context in order
		fmt.Println(wrapped) // => Output: start service: load config: config.json missing
	}
}
