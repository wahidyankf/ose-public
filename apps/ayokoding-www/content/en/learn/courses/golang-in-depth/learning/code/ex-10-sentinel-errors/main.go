// Example 10: Sentinel Errors with errors.New.
//
// A sentinel error is a package-level value callers compare against, so one
// well-known failure stays recognizable through every layer that returns it.
package main

import (
	"errors" // => builds the single shared sentinel value below
	"fmt"    // => prints the found name or the sentinel-triggered message
)

// ErrNotFound is the one "missing record" failure this package reports.
// => exported so callers in other packages can compare against it too
// => created once: identity comparison only works on a shared instance
var ErrNotFound = errors.New("employee not found") // => the sentinel itself

// directory maps employee IDs to names for the lookup below.
// => package-level map: the tiny "database" every lookup reads from
var directory = map[string]string{"e1": "Sari"} // => only e1 exists here

// find returns the name for an ID, or the sentinel when the ID is absent.
// => returning the shared value (not a fresh copy) preserves comparability
func find(id string) (string, error) { // => familiar (value, error) shape
	// => comma-ok again: presence decides, the value only follows
	name, ok := directory[id] // => missing key yields "" plus ok false
	// => absence maps to the sentinel: one failure, one meaning, everywhere
	if !ok { // => unknown ID: translate absence into the shared error
		return "", ErrNotFound // => same instance every time, by construction
	}
	return name, nil // => present: the name plus a nil error
}

func main() {
	// => present ID: the value path, sentinel never appears
	if name, err := find("e1"); err != nil { // => nil error skips the branch
		fmt.Println("error:", err) // => unreachable: e1 is in the map
	} else {
		fmt.Println("found:", name) // => Output: found: Sari
	}
	// => absent ID: compare the result against the sentinel, not its text
	if _, err := find("e9"); err == ErrNotFound { // => identity comparison
		// => == works because every layer returns the same instance
		fmt.Println("missing record") // => Output: missing record
	}
}
